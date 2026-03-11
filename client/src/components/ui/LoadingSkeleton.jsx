export default function LoadingSkeleton({ lines = 3, height = 'h-4', className = '' }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-white/5 rounded`}
          style={{ width: `${85 + (i % 3) * 5}%` }}
        />
      ))}
    </div>
  )
}
