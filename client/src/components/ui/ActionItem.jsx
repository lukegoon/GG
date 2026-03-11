const TYPE_CONFIG = {
  action:   { icon: '⚙', color: 'border-l-accent2',   bg: 'bg-accent2/5',   badge: 'badge-red' },
  alert:    { icon: '⚠', color: 'border-l-accent3',   bg: 'bg-accent3/5',   badge: 'badge-yellow' },
  help:     { icon: '💡', color: 'border-l-accent',    bg: 'bg-accent/5',    badge: 'badge-blue' },
  maintain: { icon: '✓',  color: 'border-l-success',   bg: 'bg-success/5',   badge: 'badge-green' },
}

export default function ActionItem({ insight, collapsed = false }) {
  const cfg = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.action
  const priorityLabel = ['', 'Critical', 'Important', 'Advisory'][insight.priority] ?? ''

  return (
    <div className={`border-l-2 ${cfg.color} ${cfg.bg} rounded-r-lg p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-lg shrink-0 mt-0.5">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm text-text1">{insight.title}</span>
            <span className={cfg.badge}>{priorityLabel}</span>
          </div>
          {!collapsed && (
            <p className="text-sm text-text2 leading-relaxed">{insight.text}</p>
          )}
          {insight.benchmark !== undefined && (
            <p className="text-xs text-text3 mt-2 font-mono">
              benchmark: {typeof insight.benchmark === 'number'
                ? (insight.benchmark < 1 ? (insight.benchmark * 100).toFixed(1) + '%' : insight.benchmark.toFixed(1))
                : insight.benchmark}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
