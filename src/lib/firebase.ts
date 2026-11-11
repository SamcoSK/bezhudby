import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const apiKey     = import.meta.env.VITE_FIREBASE_API_KEY
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
const projectId  = import.meta.env.VITE_FIREBASE_PROJECT_ID
const appId      = import.meta.env.VITE_FIREBASE_APP_ID

/** Whether Firebase is properly configured (non-empty env vars) */
export const isFirebaseConfigured: boolean =
  Boolean(apiKey) && Boolean(authDomain) && Boolean(projectId) && Boolean(appId)

let _app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null

if (isFirebaseConfigured) {
  _app  = initializeApp({ apiKey, authDomain, projectId, appId })
  _auth = getAuth(_app)
  _db   = getFirestore(_app)
}

export const app  = _app
export const auth = _auth
export const db   = _db
