import Topbar from './Topbar.jsx'

export default function PageContainer({ title, children, actions }) {
  return (
    <div className="min-h-screen bg-bg">
      <Topbar />
      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {(title || actions) && (
          <div className="flex items-center justify-between mb-6">
            {title && <h1 className="font-heading text-3xl text-text1 tracking-wide">{title}</h1>}
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
