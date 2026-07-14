import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react'

export type SnackbarTone = 'error' | 'success' | 'info'
type SnackbarDetail = { message: string; tone?: SnackbarTone }
const feedbackEvent = 'zentrofix:feedback'

export function showSnackbar(message: string, tone: SnackbarTone = 'error') {
  if (!message || typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<SnackbarDetail>(feedbackEvent, { detail: { message, tone } }))
}

export function FeedbackHost({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<(SnackbarDetail & { id: number }) | null>(null)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<SnackbarDetail>).detail
      if (detail?.message) { setLeaving(false); setSnackbar({ ...detail, id: Date.now() }) }
    }
    const unhandled = (event: PromiseRejectionEvent) => {
      event.preventDefault()
      const reason = event.reason
      setLeaving(false)
      setSnackbar({ message: reason instanceof Error ? reason.message : 'Something went wrong. Please try again.', tone: 'error', id: Date.now() })
    }
    const wentOffline = () => showSnackbar('You appear to be offline. Some features may not work until you reconnect.', 'info')
    const backOnline = () => showSnackbar('You’re back online.', 'success')
    window.addEventListener(feedbackEvent, receive)
    window.addEventListener('unhandledrejection', unhandled)
    window.addEventListener('offline', wentOffline)
    window.addEventListener('online', backOnline)
    return () => {
      window.removeEventListener(feedbackEvent, receive)
      window.removeEventListener('unhandledrejection', unhandled)
      window.removeEventListener('offline', wentOffline)
      window.removeEventListener('online', backOnline)
    }
  }, [])

  // Auto-dismiss: play the short exit animation first, then unmount.
  useEffect(() => {
    if (!snackbar || leaving) return
    const timer = window.setTimeout(() => setLeaving(true), snackbar.tone === 'error' ? 5000 : 3500)
    return () => window.clearTimeout(timer)
  }, [snackbar, leaving])

  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(() => { setSnackbar(null); setLeaving(false) }, 200)
    return () => window.clearTimeout(timer)
  }, [leaving])

  return <>
    {children}
    {snackbar && <div key={snackbar.id} className={`global-snackbar ${snackbar.tone || 'error'}${leaving ? ' leaving' : ''}`} role={snackbar.tone === 'error' ? 'alert' : 'status'}>
      <span>{snackbar.tone === 'success' ? '✓' : snackbar.tone === 'info' ? 'i' : '!'}</span>
      <p>{snackbar.message}</p>
      <button onClick={() => setLeaving(true)} aria-label="Dismiss notification">×</button>
    </div>}
  </>
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Zentrofix interface error', error, info)
    window.setTimeout(() => showSnackbar('The screen could not be displayed. Your data is safe; please try again.'), 0)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="app-recovery-screen">
      <img src="/zentrofix-app-icon.png" alt="Zentrofix" />
      <span>Something unexpected happened</span>
      <h1>Let’s get you back on track.</h1>
      <p>The screen could not be displayed, but the app is still available.</p>
      <div><button onClick={() => this.setState({ failed: false })}>Try again</button><button onClick={() => window.location.assign('/dashboard')}>Go to home</button></div>
    </main>
  }
}
