/**
 * UserMenu – shown when a user is signed in.
 * Displays avatar (photoURL or initial) with a dropdown menu.
 */
import { useEffect, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import { signOut, deleteAccount, translateAuthError } from '../lib/auth'

interface Props {
  user: User
  onShowStats: () => void
}

export default function UserMenu({ user, onShowStats }: Props) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus() }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
  }

  const handleDeleteRequest = () => {
    setOpen(false)
    setConfirmDelete(true)
  }

  const handleDeleteConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      await deleteAccount(user)
      setConfirmDelete(false)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(translateAuthError(code))
    } finally {
      setLoading(false)
    }
  }

  const displayName = user.displayName ?? user.email ?? 'Používateľ'
  const initial = displayName[0]?.toUpperCase() ?? '?'
  const photoURL = user.photoURL

  return (
    <>
      {/* Avatar button */}
      <div className="relative" ref={menuRef}>
        <button
          ref={triggerRef}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label={`Používateľské menu – ${displayName}`}
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-vice-pink rounded-full"
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full border-2 border-vice-pink/50 object-cover"
            />
          ) : (
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-vice-pink to-vice-purple flex items-center justify-center text-white text-sm font-black select-none">
              {initial}
            </span>
          )}
          <span className="hidden sm:block text-xs font-bold text-slate-700 dark:text-purple-200 max-w-[120px] truncate">
            {displayName}
          </span>
          <span className="text-slate-400 dark:text-purple-400 text-xs" aria-hidden="true">▾</span>
        </button>

        {/* Dropdown */}
        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-52 card p-1.5 flex flex-col gap-0.5 shadow-xl z-50 border border-vice-pink/20"
          >
            <div className="px-3 py-2 text-xs text-slate-500 dark:text-purple-400 border-b border-slate-100 dark:border-vice-border/30 mb-1 truncate">
              {user.email ?? ''}
              {!user.emailVerified && user.email && (
                <span className="ml-1 text-amber-500" title="E-mail nie je overený">⚠</span>
              )}
            </div>
            <button
              role="menuitem"
              onClick={() => { setOpen(false); onShowStats() }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-vice-card/60 transition-colors focus:outline-none"
            >
              📊 Štatistiky
            </button>
            <button
              role="menuitem"
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-vice-card/60 transition-colors focus:outline-none"
            >
              🚪 Odhlásiť sa
            </button>
            <button
              role="menuitem"
              onClick={handleDeleteRequest}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus:outline-none"
            >
              🗑️ Zmazať účet
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !loading && setConfirmDelete(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="card w-full max-w-sm p-6 flex flex-col gap-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-title" className="font-black text-red-600 dark:text-red-400 font-display">
              Zmazať účet?
            </h3>
            <p className="text-sm text-slate-600 dark:text-purple-300">
              Táto akcia je nevratná. Všetky tvoje štatistiky a dáta budú natrvalo vymazané.
            </p>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={loading}
                className="btn-secondary flex-1 disabled:opacity-50"
              >
                Zrušiť
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {loading ? 'Mažem…' : 'Áno, zmazať'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
