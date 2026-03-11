// Pure SVG scatter plot
export default function ScatterPlot({ data = [], xKey, yKey, xLabel, yLabel, highlightId, width = 500, height = 300 }) {
  if (!data.length) return <div className="text-text3 text-sm py-4">No data</div>

  const pad = { top: 20, right: 20, bottom: 40, left: 50 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom

  const xVals = data.map(d => d[xKey] ?? 0)
  const yVals = data.map(d => d[yKey] ?? 0)
  const xMax = Math.max(...xVals, 1)
  const yMax = Math.max(...yVals, 1)

  const cx = v => (v / xMax) * plotW
  const cy = v => plotH - (v / yMax) * plotH

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height}>
        <g transform={`translate(${pad.left},${pad.top})`}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map(t => (
            <g key={t}>
              <line x1={cx(xMax * t)} y1={0} x2={cx(xMax * t)} y2={plotH} stroke="rgba(255,255,255,0.04)" />
              <line x1={0} y1={cy(yMax * t)} x2={plotW} y2={cy(yMax * t)} stroke="rgba(255,255,255,0.04)" />
            </g>
          ))}

          {/* Axes */}
          <line x1={0} y1={plotH} x2={plotW} y2={plotH} stroke="#506070" strokeWidth={1} />
          <line x1={0} y1={0} x2={0} y2={plotH} stroke="#506070" strokeWidth={1} />

          {/* Team avg cross-hairs */}
          {(() => {
            const avgX = xVals.reduce((a, b) => a + b, 0) / xVals.length
            const avgY = yVals.reduce((a, b) => a + b, 0) / yVals.length
            return (
              <>
                <line x1={cx(avgX)} y1={0} x2={cx(avgX)} y2={plotH} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 3" />
                <line x1={0} y1={cy(avgY)} x2={plotW} y2={cy(avgY)} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 3" />
              </>
            )
          })()}

          {/* Points */}
          {data.map((d, i) => {
            const x = cx(d[xKey] ?? 0)
            const y = cy(d[yKey] ?? 0)
            const isHighlight = d.id === highlightId
            return (
              <g key={i}>
                <circle
                  cx={x} cy={y} r={isHighlight ? 7 : 5}
                  fill={isHighlight ? '#ff3d71' : '#00e5ff'}
                  opacity={isHighlight ? 1 : 0.6}
                />
                {(isHighlight || data.length <= 15) && (
                  <text x={x + 8} y={y + 4} fontSize={9} fill="#8899aa">{d.label ?? ''}</text>
                )}
              </g>
            )
          })}

          {/* Axis labels */}
          <text x={plotW / 2} y={plotH + 32} textAnchor="middle" fontSize={10} fill="#506070">{xLabel}</text>
          <text x={-plotH / 2} y={-38} textAnchor="middle" fontSize={10} fill="#506070" transform="rotate(-90)">{yLabel}</text>
        </g>
      </svg>
    </div>
  )
}
