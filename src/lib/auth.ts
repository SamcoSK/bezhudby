/**
 * Authentication helpers and Slovak error translations.
 * All Firebase Auth logic lives here so it can be swapped later.
 */
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  deleteUser,
  reauthenticateWithPopup,
  reauthenticateWithRedirect,
  type User,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase'
import { deleteUserData } from './firestore'

// ─── Slovak error translations ───────────────────────────────────────────────

const SK_AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-email':              'Neplatná e-mailová adresa.',
  'auth/user-disabled':              'Tento účet bol deaktivovaný.',
  'auth/user-not-found':             'Účet s touto adresou neexistuje.',
  'auth/wrong-password':             'Nesprávne heslo.',
  'auth/invalid-credential':         'Nesprávny e-mail alebo heslo.',
  'auth/email-already-in-use':       'Tento e-mail je už zaregistrovaný.',
  'auth/weak-password':              'Heslo musí mať aspoň 8 znakov.',
  'auth/too-many-requests':          'Príliš veľa pokusov. Skús neskôr.',
  'auth/popup-closed-by-user':       '', // silent
  'auth/cancelled-popup-request':    '', // silent
  'auth/popup-blocked':              'Prehliadač zablokoval prihlasovací dialóg. Skúšame iný spôsob…',
  'auth/network-request-failed':     'Problém so sieťou. Skontroluj pripojenie na internet.',
  'auth/requires-recent-login':      'Pre túto akciu sa musíš znova prihlásiť.',
  'auth/account-exists-with-different-credential':
                                     'Tento e-mail je už spojený s iným spôsobom prihlásenia.',
  'auth/credential-already-in-use':  'Tieto prihlasovacie údaje sú už použité iným účtom.',
  'auth/operation-not-allowed':      'Tento spôsob prihlásenia nie je povolený.',
  'auth/expired-action-code':        'Platnosť odkazu vypršala. Skús znova.',
  'auth/invalid-action-code':        'Neplatný odkaz. Skús znova.',
  'auth/missing-email':              'Zadaj e-mailovú adresu.',
}

export function translateAuthError(code: string): string {
  return SK_AUTH_ERRORS[code] ?? 'Nastala neočakávaná chyba. Skús to znova.'
}

// ─── Sign in / register helpers ──────────────────────────────────────────────

export async function signInWithGoogle(): Promise<User> {
  if (!auth) throw new Error('Firebase nie je nakonfigurovaný.')
  const provider = new GoogleAuthProvider()
  try {
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? ''
    // If popup is blocked, fall back to redirect
    if (code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider)
      // After redirect the page will reload; this line won't be reached
      throw err
    }
    throw err
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  if (!auth) throw new Error('Firebase nie je nakonfigurovaný.')
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function registerWithEmail(email: string, password: string): Promise<User> {
  if (!auth) throw new Error('Firebase nie je nakonfigurovaný.')
  const result = await createUserWithEmailAndPassword(auth, email, password)
  // Send verification email (non-blocking – ignore errors)
  sendEmailVerification(result.user).catch(() => undefined)
  return result.user
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase nie je nakonfigurovaný.')
  await sendPasswordResetEmail(auth, email)
}

export async function signOut(): Promise<void> {
  if (!auth) return
  await firebaseSignOut(auth)
}

export async function deleteAccount(user: User): Promise<void> {
  if (!auth) throw new Error('Firebase nie je nakonfigurovaný.')
  try {
    await deleteUserData(user.uid)
    await deleteUser(user)
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? ''
    if (code === 'auth/requires-recent-login') {
      // Try to re-authenticate with Google popup first (may work for Google users)
      const provider = new GoogleAuthProvider()
      try {
        await reauthenticateWithPopup(user, provider)
      } catch {
        try {
          await reauthenticateWithRedirect(user, provider)
        } catch {
          // ignore – will throw original error below
        }
      }
      // Retry after re-auth
      await deleteUserData(user.uid)
      await deleteUser(user)
      return
    }
    throw err
  }
}

export { isFirebaseConfigured }
