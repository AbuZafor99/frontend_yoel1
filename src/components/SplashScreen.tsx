// Full-page branded splash shown while the session is resolving on startup —
// the web counterpart of the app's SplashScreen. Reuses the orbit-loader mark
// (styles live in experience.css alongside .app-loader) so the icon animates
// while the token check runs.
export function SplashScreen({ label = 'Getting things ready…' }: { label?: string }) {
  return (
    <div className="zentro-splash" role="status" aria-live="polite">
      <div className="app-loader-mark">
        <span className="loader-orbit orbit-one" />
        <span className="loader-orbit orbit-two" />
        <img src="/zentrofix-app-icon.png" alt="" />
      </div>
      <img className="zentro-splash-wordmark" src="/app-assets/homeLogo.png" alt="Zentrofix" />
      <span className="zentro-splash-tagline">{label}</span>
    </div>
  )
}
