export default function AlertBanner({ message, onClose }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-3 bg-accent2/15 border border-accent2/30 text-accent2 px-4 py-3 rounded-lg text-sm">
      <span>⚠</span>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-accent2/60 hover:text-accent2 ml-2">✕</button>
      )}
    </div>
  )
}
