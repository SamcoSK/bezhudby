/**
 * MigrationDialog – one-time prompt to migrate guest stats to Firestore.
 * Shows only after first login when local stats exist.
 */
interface Props {
  onYes: () => void
  onNo: () => void
}

export default function MigrationDialog({ onYes, onNo }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="migration-title"
        className="card w-full max-w-sm p-6 flex flex-col gap-4 shadow-xl"
      >
        <h3 id="migration-title" className="font-black vice-gradient-text font-display text-lg">
          Preniesť štatistiky?
        </h3>
        <p className="text-sm text-slate-600 dark:text-purple-300">
          Máš uložené štatistiky z tohto zariadenia. Chceš ich preniesť do svojho účtu?
        </p>
        <div className="flex gap-3">
          <button onClick={onNo} className="btn-secondary flex-1">
            Nie
          </button>
          <button onClick={onYes} className="btn-primary flex-1">
            Áno, preniesť
          </button>
        </div>
      </div>
    </div>
  )
}
