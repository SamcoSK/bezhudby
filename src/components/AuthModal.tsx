/**
 * AuthModal – login/register modal with Google + email/password.
 * Keyboard accessible, focus-trapped, closes on Esc.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  sendPasswordReset,
  translateAuthError,
  isFirebaseConfigured,
} from '../lib/auth'

interface Props {
  onClose: () => void
}

type Mode = 'login' | 'register' | 'reset'

export default function AuthModal({ onClose }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [emailVerifyNotice, setEmailVerifyNotice] = useState(false)

  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFocusRef = useRef<HTMLButtonElement>(null)

  // ── Focus trap ────────────────────────────────────────────────────────────
  useEffect(() => {
    firstFocusRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        const dialog = dialogRef.current
        if (!dialog) return
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first?.focus() }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clearMessages = () => { setError(''); setInfo('') }

  const handleGoogle = async () => {
    clearMessages()
    setLoading(true)
    try {
      await signInWithGoogle()
      onClose()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      const msg = translateAuthError(code)
      if (msg) setError(msg)
      // 'auth/popup-closed-by-user' → empty msg → silent
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearMessages()

    // Client-side validation
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Zadaj platnú e-mailovú adresu.')
      return
    }
    if (mode !== 'reset' && password.length < 8) {
      setError('Heslo musí mať aspoň 8 znakov.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
        onClose()
      } else if (mode === 'register') {
        await registerWithEmail(email, password)
        setEmailVerifyNotice(true)
        setInfo('Registrácia úspešná! Skontroluj si e-mail pre overenie.')
      } else {
        await sendPasswordReset(email)
        setInfo('Odkaz na obnovenie hesla bol odoslaný na tvoj e-mail.')
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(translateAuthError(code) || 'Nastala neočakávaná chyba.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: Mode) => {
    clearMessages()
    setEmailVerifyNotice(false)
    setMode(m)
  }

  if (!isFirebaseConfigured) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
          className="card w-full max-w-sm p-6 flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="auth-title" className="text-lg font-black vice-gradient-text font-display">
            Prihlásenie nedostupné
          </h2>
          <p className="text-sm text-slate-600 dark:text-purple-300">
            Firebase nie je nakonfigurovaný. Hra funguje plne ako hosť.
          </p>
          <button className="btn-secondary" onClick={onClose}>Zavrieť</button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="card w-full max-w-sm p-6 flex flex-col gap-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 id="auth-title" className="text-lg font-black vice-gradient-text font-display">
            {mode === 'login' ? 'Prihlásiť sa' : mode === 'register' ? 'Vytvoriť účet' : 'Zabudnuté heslo'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl leading-none focus:outline-none focus:ring-2 focus:ring-vice-pink rounded"
            aria-label="Zavrieť"
          >
            ✕
          </button>
        </div>

        {/* Error / Info banners */}
        {error && (
          <div role="alert" className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {info && (
          <div role="status" className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
            {info}
          </div>
        )}
        {emailVerifyNotice && (
          <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            ⚠️ Tvoj e-mail ešte nie je overený. Hra funguje, ale odporúčame overiť e-mail cez doručený odkaz.
          </div>
        )}

        {/* Google button */}
        {mode !== 'reset' && (
          <button
            ref={firstFocusRef}
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-vice-pink"
            aria-label="Pokračovať cez Google"
          >
            {/* Google logo SVG – follows official guidelines */}
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            {loading ? 'Prihlasujem…' : 'Pokračovať cez Google'}
          </button>
        )}

        {/* Divider */}
        {mode !== 'reset' && (
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-purple-400">
            <div className="flex-1 h-px bg-slate-200 dark:bg-vice-border/40" />
            alebo
            <div className="flex-1 h-px bg-slate-200 dark:bg-vice-border/40" />
          </div>
        )}

        {/* Email / password form */}
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3" noValidate>
          <div>
            <label htmlFor="auth-email" className="block text-xs font-bold text-slate-600 dark:text-purple-300 mb-1">
              E-mail
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-vice-border bg-white dark:bg-vice-card text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-vice-pink disabled:opacity-50"
              placeholder="tvoj@email.com"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label htmlFor="auth-password" className="block text-xs font-bold text-slate-600 dark:text-purple-300 mb-1">
                Heslo <span className="font-normal text-slate-400">(min. 8 znakov)</span>
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-vice-border bg-white dark:bg-vice-card text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-vice-pink disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading
              ? 'Moment…'
              : mode === 'login'
                ? 'Prihlásiť sa'
                : mode === 'register'
                  ? 'Vytvoriť účet'
                  : 'Odoslať odkaz'}
          </button>
        </form>

        {/* Mode toggles */}
        <div className="flex flex-col gap-1 text-xs text-center">
          {mode === 'login' && (
            <>
              <button onClick={() => switchMode('reset')} className="text-vice-pink hover:underline focus:outline-none">
                Zabudnuté heslo?
              </button>
              <button onClick={() => switchMode('register')} className="text-purple-600 dark:text-purple-300 hover:underline focus:outline-none">
                Nemáš účet? <span className="font-bold">Zaregistruj sa</span>
              </button>
            </>
          )}
          {mode === 'register' && (
            <button onClick={() => switchMode('login')} className="text-purple-600 dark:text-purple-300 hover:underline focus:outline-none">
              Už máš účet? <span className="font-bold">Prihlásiť sa</span>
            </button>
          )}
          {mode === 'reset' && (
            <button onClick={() => switchMode('login')} className="text-purple-600 dark:text-purple-300 hover:underline focus:outline-none">
              ← Späť na prihlásenie
            </button>
          )}
        </div>

        {/* Guest option */}
        <button
          onClick={onClose}
          className="text-xs text-slate-400 dark:text-purple-400 hover:text-slate-600 dark:hover:text-purple-200 underline focus:outline-none"
        >
          Pokračovať ako hosť
        </button>

        {/* Privacy notice */}
        <p className="text-[10px] text-slate-400 dark:text-purple-500 text-center leading-relaxed border-t border-slate-100 dark:border-vice-border/30 pt-3">
          Ukladáme: e-mail, meno z Google účtu a štatistiky tvojich hier.{' '}
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-vice-pink">
            Zásady ochrany súkromia
          </a>
        </p>
      </div>
    </div>
  )
}
