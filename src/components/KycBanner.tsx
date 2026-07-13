import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { showSnackbar } from './FeedbackHost'

// Identity verification (KYC) runs through the app's native mobile flow (Didit
// WebView), so it can't be completed on the web. Every "Verify Now" affordance
// opens a popup pointing the tradesperson to the mobile app to finish it.
// Store links aren't live yet — the badges show "Coming soon" for now.
const comingSoon = () => showSnackbar('Coming soon — the Zentrofix app will be available on the App Store and Google Play shortly.', 'info')

const AppleLogo = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M16.4 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8ZM14.2 5.6c.6-.8 1.1-1.9.9-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.9-1.3Z"/></svg>
const PlayLogo = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M3.6 2.3c-.3.2-.5.6-.5 1.1v17.2c0 .5.2.9.5 1.1l9.2-9.7L3.6 2.3Zm11 7.2 2.7-2.9-9.9-5.6c-.4-.2-.8-.2-1.1-.1l8.3 8.6Zm0 5 8.3-8.6c.3.1.5.4.6.8v.1c.1.5-.1 1-.6 1.3l-2.9 1.6-2.7-2.9-2.7 2.9 2.7 2.8Zm-1 1-8.3 8.6c.3.1.7.1 1.1-.1l9.9-5.6-2.7-2.9Z"/></svg>

// A compact popover anchored to the "Verify Now" button (not a full-screen
// modal), closing on outside-click or Escape.
function VerifyNowButton({ className, children }: { className: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => { if (anchor.current && !anchor.current.contains(event.target as Node)) setOpen(false) }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
  return <div className="verify-anchor" ref={anchor}>
    <button type="button" className={className} onClick={() => setOpen(current => !current)}>{children}</button>
    {open && <div className="verify-popover" role="dialog" aria-label="Verify on the mobile app">
      <div className="verify-popover-head"><strong>Verify on the mobile app</strong><button type="button" className="verify-popover-close" onClick={() => setOpen(false)} aria-label="Close">×</button></div>
      <p>Identity verification is completed in the Zentrofix app. Download it to verify and unlock all jobs.</p>
      <div className="store-badges">
        <button type="button" className="store-badge" onClick={comingSoon}><AppleLogo/><span><small>Download on the</small><strong>App Store</strong></span></button>
        <button type="button" className="store-badge" onClick={comingSoon}><PlayLogo/><span><small>Get it on</small><strong>Google Play</strong></span></button>
      </div>
    </div>}
  </div>
}

// Dashboard banner shown to unverified tradespeople — red-bordered so it stands
// out. Mirrors the app's "You are not verified" / "Verify Now" banner.
export function KycUnverifiedBanner() {
  return <div className="kyc-alert" role="alert">
    <span className="kyc-alert-icon"><Icon name="shield" size={20}/></span>
    <div><strong>You are not verified</strong><small>Verify your identity to access all jobs.</small></div>
    <VerifyNowButton className="kyc-alert-action">Verify Now</VerifyNowButton>
  </div>
}

// Profile identity row: green "verified" label when done, otherwise a red
// "Not verified" badge plus a "Verify now" action.
export function ProfileVerificationStatus({ verified }: { verified?: boolean }) {
  if (verified) return <span className="verified-label">✓ Identity verified</span>
  return <div className="profile-unverified">
    <span className="unverified-badge"><Icon name="shield" size={13}/> Not verified</span>
    <VerifyNowButton className="profile-verify-now">Verify now <Icon name="arrow" size={14}/></VerifyNowButton>
  </div>
}
