import { Navigate, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { isHomeowner, useAuth } from './context/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { PublicHomePage } from './pages/PublicHomePage'
import { DashboardPage } from './pages/DashboardPage'
import { JobsPage } from './pages/JobsPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { ChatPage } from './pages/ChatPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { ProfilePage } from './pages/ProfilePage'
import { JobProgressPage } from './pages/JobProgressPage'
import { Icon } from './components/Icon'
import { AppLoader } from './components/AppLoader'

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <AppLoader label="Opening Zentrofix…" fullPage />
  return user ? <>{children}</> : <Navigate to="/auth" replace />
}

const navItems = [
  { to: '/dashboard', label: 'Home', icon: 'home' as const, key: 'home' },
  { to: '/jobs?view=discover', label: 'Discover', icon: 'search' as const, key: 'discover' },
  { to: '/jobs?view=my', label: 'My jobs', icon: 'briefcase' as const, key: 'jobs' },
  { to: '/notifications', label: 'Alerts', icon: 'bell' as const, key: 'alerts' },
  { to: '/profile', label: 'Profile', icon: 'user' as const, key: 'profile' },
]

function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const homeowner = isHomeowner(user?.role)
  const location = useLocation()
  const navigate = useNavigate()
  const current = location.pathname === '/dashboard' ? 'home' : location.pathname === '/notifications' ? 'alerts' : location.pathname === '/profile' ? 'profile' : location.pathname === '/jobs' && new URLSearchParams(location.search).get('view') === 'my' ? 'jobs' : location.pathname === '/jobs' ? 'discover' : ''
  const locationText = user?.address || user?.serviceArea || 'Set your location'

  return <div className="zentro-shell">
    <header className="app-web-header">
      <Link to="/dashboard" className="app-logo-link"><img src="/app-assets/homeLogo.png" alt="Zentrofix" /></Link>
      <nav className="desktop-app-nav">
        {navItems.map(item => <Link key={item.key} to={item.to} className={current === item.key ? 'app-nav-item active' : 'app-nav-item'}><Icon name={item.icon} size={18}/>{item.label}</Link>)}
      </nav>
      <div className="header-account">
        {homeowner && <Link to="/dashboard?postJob=1" className="header-post-job"><Icon name="plus" size={18}/><span>Post a job</span></Link>}
        <button className="header-location" onClick={() => navigate('/profile?pickLocation=1')}><Icon name="map" size={18}/><span><small>My location</small><strong>{locationText}</strong></span></button>
        <button className="header-user" onClick={() => navigate('/profile')} aria-label="Open profile">{user?.profileImage?.url ? <img src={user.profileImage.url} alt=""/> : (user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}</button>
        <button className="header-logout" onClick={() => { logout(); navigate('/') }} aria-label="Sign out"><Icon name="logout" size={18}/></button>
      </div>
    </header>
    <main className="app-web-main"><div className="app-page-content"><div className="route-transition" key={`${location.pathname}${location.search}`}>{children}</div></div></main>
    <nav className="mobile-app-nav">
      {navItems.map(item => <Link key={item.key} to={item.to} className={current === item.key ? 'mobile-nav-item active' : 'mobile-nav-item'}><Icon name={item.icon} size={20}/><b>{item.label}</b></Link>)}
    </nav>
  </div>
}

export default function App() {
  return <Routes>
    <Route path="/" element={<PublicHomePage />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/dashboard" element={<Protected><Shell><DashboardPage /></Shell></Protected>} />
    <Route path="/jobs" element={<Protected><Shell><JobsPage /></Shell></Protected>} />
    <Route path="/jobs/:id" element={<Protected><Shell><JobDetailPage /></Shell></Protected>} />
    <Route path="/jobs/:id/progress" element={<Protected><Shell><JobProgressPage /></Shell></Protected>} />
    <Route path="/chat" element={<Protected><Shell><ChatPage /></Shell></Protected>} />
    <Route path="/notifications" element={<Protected><Shell><NotificationsPage /></Shell></Protected>} />
    <Route path="/profile" element={<Protected><Shell><ProfilePage /></Shell></Protected>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
