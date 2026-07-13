import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import { AppErrorBoundary, FeedbackHost } from './components/FeedbackHost'
import './styles.css'
import './professional.css'
import './feedback.css'
import './workflow.css'
import './experience.css'

createRoot(document.getElementById('root')!).render(<StrictMode><FeedbackHost><AppErrorBoundary><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></AppErrorBoundary></FeedbackHost></StrictMode>)
