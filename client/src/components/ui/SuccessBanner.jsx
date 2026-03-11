export default function SuccessBanner({ message, onClose }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-3 bg-success/15 border border-success/30 text-success px-4 py-3 rounded-lg text-sm">
      <span>✓</span>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-success/60 hover:text-success ml-2">✕</button>
      )}
    </div>
  )
}
