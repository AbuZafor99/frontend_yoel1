import { useEffect, useRef, useState } from 'react'
import { AppLoader } from './AppLoader'

type GoogleCredentialResponse = { credential?: string }
type GoogleIdentity = {
  initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void; use_fedcm_for_prompt?: boolean }) => void
  renderButton: (element: HTMLElement, config: Record<string, string | number | boolean>) => void
  disableAutoSelect: () => void
}

declare global { interface Window { google?: { accounts: { id: GoogleIdentity } } } }

const scriptId = 'google-identity-services'
const scriptSource = 'https://accounts.google.com/gsi/client'

function loadGoogleIdentity() {
  return new Promise<GoogleIdentity>((resolve, reject) => {
    if (window.google?.accounts.id) return resolve(window.google.accounts.id)
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null
    const ready = () => window.google?.accounts.id ? resolve(window.google.accounts.id) : reject(new Error('Google sign-in is unavailable right now.'))
    if (existing) {
      existing.addEventListener('load', ready, { once: true })
      existing.addEventListener('error', () => reject(new Error('Could not load Google sign-in.')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = scriptId
    script.src = scriptSource
    script.async = true
    script.defer = true
    script.onload = ready
    script.onerror = () => reject(new Error('Could not load Google sign-in.'))
    document.head.appendChild(script)
  })
}

export function GoogleSignInButton({ onCredential, onError, disabled = false }: { onCredential: (credential: string) => void; onError: (message: string) => void; disabled?: boolean }) {
  const button = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '766345686783-4kg4dtokgs2hl2ebj8jdvvd5q64nu2md.apps.googleusercontent.com'

  useEffect(() => {
    let active = true
    loadGoogleIdentity().then(identity => {
      if (!active || !button.current) return
      identity.initialize({
        client_id: clientId,
        use_fedcm_for_prompt: true,
        callback: response => response.credential ? onCredential(response.credential) : onError('Google did not return a sign-in credential.'),
      })
      button.current.replaceChildren()
      identity.renderButton(button.current, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', logo_alignment: 'left', width: 360 })
      setLoading(false)
    }).catch(error => {
      if (!active) return
      setLoading(false)
      onError(error instanceof Error ? error.message : 'Google sign-in is unavailable.')
    })
    return () => { active = false }
  }, [clientId, onCredential, onError])

  return <div className={`google-signin-slot ${disabled ? 'disabled' : ''}`} aria-disabled={disabled}>
    {loading && <AppLoader label="Preparing Google sign-in…" compact />}
    <div ref={button} className="google-rendered-button" />
  </div>
}
