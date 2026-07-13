import { useCallback, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../components/Icon'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { AppLoader } from '../components/AppLoader'
import { showSnackbar } from '../components/FeedbackHost'

type AuthMode = 'login' | 'register' | 'verify' | 'forgot' | 'reset'
type AuthRole = 'homeowner' | 'tradesperson'

function RolePicker({ role, onChange, compact = false }: { role: AuthRole; onChange: (role: AuthRole) => void; compact?: boolean }) {
  return <div className={`role-picker ${compact ? 'compact-role-picker' : ''}`}>
    <button type="button" className={role === 'homeowner' ? 'role-option selected' : 'role-option'} onClick={() => onChange('homeowner')}>
      <b><Icon name="home" size={22}/></b><span><strong>Homeowner</strong><small>I need help with a job</small></span>
    </button>
    <button type="button" className={role === 'tradesperson' ? 'role-option selected' : 'role-option'} onClick={() => onChange('tradesperson')}>
      <b><Icon name="briefcase" size={22}/></b><span><strong>Tradesperson</strong><small>I offer professional services</small></span>
    </button>
  </div>
}

export function AuthPage() {
  const params = new URLSearchParams(useLocation().search)
  const navigate = useNavigate()
  const { user, login, googleLogin, register } = useAuth()
  const [mode, setMode] = useState<AuthMode>(params.get('mode') === 'register' ? 'register' : 'login')
  const [role, setRole] = useState<AuthRole>('homeowner')
  const [email, setEmail] = useState('')
  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '', phone: '', address: '', otp: '' })
  const [busy, setBusy] = useState(false)
  const [busyLabel, setBusyLabel] = useState('Signing you in…')

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm(current => ({ ...current, [key]: event.target.value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setBusyLabel(mode === 'register' ? 'Creating your account…' : mode === 'verify' ? 'Verifying your email…' : mode === 'forgot' ? 'Sending your reset code…' : mode === 'reset' ? 'Updating your password…' : 'Signing you in…')
    try {
      if (mode === 'login') {
        await login(email, form.password)
        showSnackbar('Welcome back to Zentrofix.', 'success')
        navigate('/dashboard')
      } else if (mode === 'register') {
        await register({ email, name: form.name, password: form.password, confirmPassword: form.confirmPassword, phone: form.phone, address: form.address, role })
        showSnackbar('Account created. Check your email for the verification code.', 'success')
        setMode('verify')
      } else if (mode === 'verify') {
        await api.verifyOtp(email, form.otp)
        showSnackbar('Email verified. You can now sign in.', 'success')
        setMode('login')
      } else if (mode === 'forgot') {
        await api.forgotPassword(email)
        showSnackbar('We sent a reset code if that email is registered.', 'success')
        setMode('reset')
      } else {
        await api.resetPassword({ email, otp: form.otp, password: form.password })
        showSnackbar('Password reset. You can sign in now.', 'success')
        setMode('login')
      }
    } catch {
      // API failures are presented by the global snackbar host.
    } finally {
      setBusy(false)
    }
  }

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setBusy(true)
    setBusyLabel('Connecting your Google account…')
    try {
      await googleLogin(credential, role)
      showSnackbar('Signed in with Google successfully.', 'success')
      navigate('/dashboard')
    } catch {
      // API failures are presented by the global snackbar host.
    } finally {
      setBusy(false)
    }
  }, [googleLogin, navigate, role])

  const handleGoogleError = useCallback((message: string) => showSnackbar(message), [])

  if (user) return <Navigate to="/dashboard" replace />

  const title = mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : mode === 'verify' ? 'Verify your email' : mode === 'forgot' ? 'Reset your password' : 'Choose a new password'
  const showGoogle = mode === 'login' || mode === 'register'

  return <div className="auth-page">
    {busy && <AppLoader label={busyLabel} overlay />}
    <div className="auth-visual">
      <Link className="auth-logo" to="/"><img src="/app-assets/homeLogo.png" alt="Zentrofix"/></Link>
      <div className="auth-visual-copy"><span className="auth-kicker"><Icon name="shield" size={17}/> Trusted local work</span><h1>Good work starts with a good connection.</h1><p>Find trusted local skills, communicate clearly and keep every job moving.</p><div className="auth-benefits"><span><Icon name="check" size={16}/> Verified professionals</span><span><Icon name="check" size={16}/> One simple workflow</span></div></div>
      <div className="auth-quote">“The whole job, from quote to completion, finally feels simple.”<small>Zentrofix community</small></div>
    </div>
    <div className="auth-panel">
      <Link className="mobile-auth-logo" to="/"><img src="/app-assets/homeLogo.png" alt="Zentrofix"/></Link>
      <div className="auth-card">
        <span className="eyebrow">{mode === 'register' ? 'Join Zentrofix' : 'Welcome to Zentrofix'}</span>
        <h2>{title}</h2>
        <p className="muted">{mode === 'login' ? 'Sign in to continue to your account.' : mode === 'register' ? 'Choose how you’ll use Zentrofix.' : 'A small step and you’ll be back on track.'}</p>

        {mode === 'register' && <RolePicker role={role} onChange={setRole}/>} 

        {showGoogle && <div className="google-auth-area">
          {mode === 'login' && <><p className="google-role-label">Choose your role, then continue with Google</p><RolePicker role={role} onChange={setRole} compact /></>}
          <GoogleSignInButton onCredential={handleGoogleCredential} onError={handleGoogleError} disabled={busy}/>
          <div className="google-auth-heading">or continue with email</div>
        </div>}

        <form onSubmit={submit}>
          {mode === 'register' && <label>Your name<input required value={form.name} onChange={update('name')} placeholder="Jane Smith" /></label>}
          <label>Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          {mode === 'register' && <><label>Phone number<input value={form.phone} onChange={update('phone')} placeholder="Optional" /></label><label>Address<input value={form.address} onChange={update('address')} placeholder="Town or postcode" /></label></>}
          {(mode === 'login' || mode === 'register' || mode === 'reset') && <label>{mode === 'reset' ? 'New password' : 'Password'}<input required type="password" value={form.password} onChange={update('password')} placeholder="At least 8 characters" /></label>}
          {mode === 'register' && <label>Confirm password<input required type="password" value={form.confirmPassword} onChange={update('confirmPassword')} /></label>}
          {(mode === 'verify' || mode === 'reset') && <label>Verification code<input required value={form.otp} onChange={update('otp')} inputMode="numeric" placeholder="6 digit code" /></label>}
          <button className="button button-primary full-button" disabled={busy}>{mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'verify' ? 'Verify email' : mode === 'forgot' ? 'Send reset code' : 'Set new password'}</button>
        </form>
        {mode === 'login' && <button className="text-button" onClick={() => setMode('forgot')}>Forgot your password?</button>}
        <div className="auth-switch">{mode === 'login' ? <>New to Zentrofix? <button onClick={() => setMode('register')}>Create an account</button></> : <><button onClick={() => setMode('login')}>← Back to sign in</button>{mode === 'verify' && <button onClick={() => api.resendOtp(email).then(() => showSnackbar('A new code was sent.', 'success'))}>Resend code</button>}</>}</div>
      </div>
      <small className="auth-legal">By continuing you agree to Zentrofix’s terms and privacy policy.</small>
    </div>
  </div>
}
