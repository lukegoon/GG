// Pure SVG bar chart — no external library
export default function BarChart({ data = [], height = 160, color = '#00e5ff', highlightId }) {
  if (!data.length) return <div className="text-text3 text-sm py-4">No data</div>

  const maxVal = Math.max(...data.map(d => d.value ?? 0), 0.01)
  const barWidth = Math.max(8, Math.min(40, (600 / data.length) - 4))
  const svgWidth = data.length * (barWidth + 4)
  const chartH = height - 30

  return (
    <div className="overflow-x-auto">
      <svg width={svgWidth} height={height} className="block">
        {data.map((d, i) => {
          const barH = Math.max(2, ((d.value ?? 0) / maxVal) * chartH)
          const x = i * (barWidth + 4)
          const y = chartH - barH
          const isHighlight = d.id === highlightId || d.highlight
          const fillColor = isHighlight ? '#ff3d71' : color

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill={fillColor}
                opacity={isHighlight ? 1 : 0.7}
                rx={2}
              />
              {barWidth >= 20 && (
                <text
                  x={x + barWidth / 2}
                  y={height - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#506070"
                  className="select-none"
                >
                  {String(d.label ?? '').slice(0, 8)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
