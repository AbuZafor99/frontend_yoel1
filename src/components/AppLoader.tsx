export function AppLoader({ label = 'Loading…', fullPage = false, overlay = false, compact = false }: { label?: string; fullPage?: boolean; overlay?: boolean; compact?: boolean }) {
  const classes = ['app-loader', fullPage ? 'full-page' : '', overlay ? 'overlay' : '', compact ? 'compact' : ''].filter(Boolean).join(' ')
  return <div className={classes} role="status" aria-live="polite">
    <div className="app-loader-mark">
      <span className="loader-orbit orbit-one" />
      <span className="loader-orbit orbit-two" />
      <img src="/zentrofix-app-icon.png" alt="" />
    </div>
    <p>{label}</p>
  </div>
}
