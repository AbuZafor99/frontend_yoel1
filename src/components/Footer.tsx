import { Link } from 'react-router-dom'

export function Footer() {
  return <footer className="app-footer">
    <div className="app-footer-inner">
      <div className="app-footer-brand">
        <img src="/app-assets/homeLogo.png" alt="Zentrofix"/>
        <p>Connecting homeowners with trusted local tradespeople.</p>
      </div>
      <div className="app-footer-links">
        <div><span>Legal</span><Link to="/legal/terms">Terms & Conditions</Link><Link to="/legal/privacy">Privacy Policy</Link><Link to="/legal/cookies">Cookies</Link></div>
        <div><span>Company</span><a href="mailto:info@zentrofix.com">info@zentrofix.com</a><span className="app-footer-address">66 Paul Street, London, EC2A 4NA</span></div>
      </div>
    </div>
    <div className="app-footer-bottom"><span>© {new Date().getFullYear()} Zentrofix Ltd. All rights reserved.</span><span>Company No. 17276897</span></div>
  </footer>
}
