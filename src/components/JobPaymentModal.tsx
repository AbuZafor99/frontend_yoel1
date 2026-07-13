import { useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../api/client'
import type { Job, PaymentIntent } from '../types'
import { Icon } from './Icon'
import { Modal } from './Modal'
import { AppLoader } from './AppLoader'
import { showSnackbar } from './FeedbackHost'

type StripeElement = { mount: (target: HTMLElement) => void; destroy: () => void }
type StripeElements = { create: (type: 'payment') => StripeElement }
type StripeClient = {
  elements: (options: { clientSecret: string; appearance?: Record<string, unknown> }) => StripeElements
  confirmPayment: (options: { elements: StripeElements; confirmParams: { return_url: string }; redirect: 'if_required' }) => Promise<{ error?: { message?: string }; paymentIntent?: { id: string; status: string } }>
}

declare global { interface Window { Stripe?: (key: string) => StripeClient } }

let stripeScriptPromise: Promise<void> | null = null
function loadStripeScript() {
  if (window.Stripe) return Promise.resolve()
  if (!stripeScriptPromise) stripeScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Secure payment form could not be loaded'))
    document.head.appendChild(script)
  })
  return stripeScriptPromise
}

const appTestPublishableKey = 'pk_test_51SXwBl4yPuUDy8fnlhmKIo8rBx4tsVztSUiuqd5xMfcgWPp7QxojNgjtBT0nUg6YUl4TZOoLXIbtJRpQeEKxO1CY009wc0HTDM'

export function JobPaymentModal({ job, onClose, onPaid }: { job: Job; onClose: () => void; onPaid: (job: Job) => void }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const elementRef = useRef<StripeElement | null>(null)
  const stripeRef = useRef<StripeClient | null>(null)
  const elementsRef = useRef<StripeElements | null>(null)
  const [intent, setIntent] = useState<PaymentIntent | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    let active = true
    const initialize = async () => {
      try {
        const nextIntent = await api.initiatePayment(job._id)
        await loadStripeScript()
        if (!active || !mountRef.current || !window.Stripe) return
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || appTestPublishableKey
        const stripe = window.Stripe(publishableKey)
        const elements = stripe.elements({ clientSecret: nextIntent.clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#1d4ed8', borderRadius: '10px' } } })
        const paymentElement = elements.create('payment')
        paymentElement.mount(mountRef.current)
        stripeRef.current = stripe
        elementsRef.current = elements
        elementRef.current = paymentElement
        setIntent(nextIntent)
      } catch (caught) {
        if (active && !(caught instanceof ApiError)) showSnackbar(caught instanceof Error ? caught.message : 'Could not prepare payment')
      } finally {
        if (active) setLoading(false)
      }
    }
    initialize()
    return () => { active = false; elementRef.current?.destroy() }
  }, [job._id])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripeRef.current || !elementsRef.current || !intent || paying) return
    setPaying(true)
    try {
      const result = await stripeRef.current.confirmPayment({ elements: elementsRef.current, confirmParams: { return_url: window.location.href }, redirect: 'if_required' })
      if (result.error) throw new Error(result.error.message || 'Payment could not be completed')
      const confirmed = await api.confirmPayment(intent.paymentIntentId)
      onPaid(confirmed.job)
    } catch (caught) {
      if (!(caught instanceof ApiError)) showSnackbar(caught instanceof Error ? caught.message : 'Payment could not be completed')
    } finally {
      setPaying(false)
    }
  }

  return <Modal title="Activate awarded job" onClose={paying ? () => undefined : onClose}>
    <div className="payment-summary"><span><Icon name="briefcase" size={20}/></span><div><small>Awarded job</small><strong>{job.title}</strong></div><b>$10.00</b></div>
    <div className="payment-explainer"><Icon name="shield" size={18}/><p>The one-time platform fee activates progress tracking and unlocks contact details for both parties.</p></div>
    <form className="stripe-payment-form" onSubmit={submit}>
      <div ref={mountRef} className="stripe-payment-element" />
      {loading && <AppLoader label="Loading secure payment…" compact />}
      <button className="button button-primary full-button" disabled={loading || paying || !intent}>{paying ? <><span className="button-spinner"/> Processing…</> : <><Icon name="lock" size={16}/> Pay $10 securely</>}</button>
    </form>
    <div className="payment-security"><Icon name="lock" size={14}/> Payments are securely processed by Stripe. Zentrofix never stores card details.</div>
  </Modal>
}
