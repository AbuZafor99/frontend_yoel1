import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isHomeowner, useAuth } from '../context/AuthContext'
import { Icon } from '../components/Icon'

function LegalShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const homeTo = user ? '/dashboard' : '/'

  // The browser/device back button normally pops to whatever page happened to
  // be in history before this one, which can land anywhere depending on how
  // the visitor arrived. These are legal pages reachable from many places
  // (footer, profile, a shared link), so "back" here should always mean
  // "home", not "wherever history says came before". Push a duplicate entry
  // on mount so the next back press fires a popstate we intercept ourselves
  // and redirect home, instead of letting the browser's default back happen.
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const onPopState = () => navigate(homeTo, { replace: true })
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [homeTo, navigate])

  return <div className="legal-page">
    <Link className="back-link" to={homeTo}>← Back to Home</Link>
    <header className="legal-header"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></header>
    <div className="legal-company-card">
      <div className="legal-company-row"><Icon name="map" size={16}/><div><small>Registered Address</small><strong>66 Paul Street, London, England, United Kingdom, EC2A 4NA</strong></div></div>
      <div className="legal-company-row"><Icon name="shield" size={16}/><div><small>Company Registration Number</small><strong>17276897</strong></div></div>
      <div className="legal-company-row"><Icon name="mail" size={16}/><div><small>Contact Email</small><strong>info@zentrofix.com</strong></div></div>
    </div>
    {children}
  </div>
}

function LegalSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section className="legal-section"><div className="legal-section-head"><span>{number}</span><h2>{title}</h2></div>{children}</section>
}

function BulletList({ items }: { items: string[] }) {
  return <ul className="legal-bullets">{items.map(item => <li key={item}>{item}</li>)}</ul>
}

export function PrivacyPolicyPage() {
  return <LegalShell eyebrow="UK GDPR Compliant" title="Privacy Policy">
    <LegalSection number="1" title="Who We Are"><p>ZENTROFIX LTD operates the ZentroFix mobile app and website, connecting homeowners with tradespeople.</p></LegalSection>
    <LegalSection number="2" title="Data We Collect">
      <h3 className="legal-subheading">Personal Data</h3>
      <BulletList items={['Name', 'Email', 'Phone number', 'Address', 'Profile photo', 'ID documents (traders)', 'Business details']}/>
      <h3 className="legal-subheading">Usage Data</h3>
      <BulletList items={['Login activity', 'Device information', 'IP address', 'Job posts', 'Messages', 'Reviews']}/>
      <h3 className="legal-subheading">Payment Data</h3>
      <BulletList items={['Lead unlock payments (processed securely by third-party providers)']}/>
    </LegalSection>
    <LegalSection number="3" title="How We Use Your Data">
      <BulletList items={['Account creation', 'Identity verification', 'Matching customers with tradespeople', 'Processing lead unlock payments', 'Fraud prevention', 'Customer support', 'Platform improvement', 'Legal compliance']}/>
    </LegalSection>
    <LegalSection number="4" title="Legal Basis (UK GDPR)">
      <p>We process data under:</p>
      <BulletList items={['Contractual necessity', 'Legitimate interest', 'Legal obligation', 'Consent (cookies, marketing)']}/>
    </LegalSection>
    <LegalSection number="5" title="Data Sharing">
      <p>We share data with:</p>
      <BulletList items={['Payment processors', 'Verification partners', 'Hosting providers', 'Customer support tools', 'Law enforcement (when required)']}/>
      <p><strong>We do not sell personal data.</strong></p>
    </LegalSection>
    <LegalSection number="6" title="Data Retention">
      <div className="legal-retention-list">
        {[['Account data', 'While active'], ['Verification documents', 'Up to 6 years'], ['Messages', 'Up to 24 months'], ['Financial records', '6 years']].map(([label, value]) => <div key={label}><strong>{label}</strong><span>{value}</span></div>)}
      </div>
    </LegalSection>
    <LegalSection number="7" title="Your Rights (UK GDPR)">
      <p>You may request:</p>
      <BulletList items={['Access', 'Correction', 'Deletion', 'Restriction', 'Portability', 'Objection']}/>
      <p>Requests can be made via info@zentrofix.com.</p>
    </LegalSection>
    <LegalSection number="8" title="Security">
      <p>We use:</p>
      <BulletList items={['Encryption', 'Secure servers', 'Access controls', 'Fraud monitoring']}/>
    </LegalSection>
    <LegalSection number="9" title="Contact"><p>For privacy requests: info@zentrofix.com</p></LegalSection>
  </LegalShell>
}

const homeownerTerms = [
  ['1. Introduction', 'These Terms apply to all UK Homeowners using the ZentroFix platform to post jobs and connect with tradespeople. By creating an account or posting a job, you agree to these Terms.'],
  ['2. Eligibility', ['Be 18 or older', 'Be a UK resident', 'Use the platform for lawful purposes']],
  ['3. Your Responsibilities', ['Provide accurate job descriptions', 'Not post fake, misleading, or abusive job requests', 'Communicate respectfully with tradespeople', 'Ensure the job complies with UK regulations']],
  ['4. Job Posting', 'Job details must be accurate, honest and not intentionally misleading. Fake job postings may result in account suspension.'],
  ['5. Contact With Tradespeople', ['Tradespeople may contact you after unlocking your job details.', 'You choose who to hire.', 'ZentroFix does not guarantee workmanship, pricing, or availability.', 'ZentroFix is not a party to any contract between you and the tradesperson.']],
  ['6. Payments for Work', ['Payments for work are made directly between you and the tradesperson.', 'ZentroFix does not process or handle job payments.', 'ZentroFix is not responsible for disputes over cost, quality, or completion.']],
  ['7. Reviews', 'You may leave reviews based on genuine experiences. ZentroFix may remove reviews that are abusive, false, defamatory, or unrelated to the job.'],
  ['8. Liability', 'ZentroFix is not liable for work quality, damages caused by tradespeople, missed appointments, losses arising from hiring decisions, or any agreements made between you and a tradesperson. ZentroFix provides lead generation and communication tools only.'],
  ['9. Account Suspension', ['Fake job postings', 'Abuse or harassment', 'Fraudulent activity', 'Violations of these Terms']],
  ['10. Changes to Terms', 'We may update these Terms. Continued use means acceptance.'],
  ['11. Governing Law', 'These Terms are governed by UK law.'],
] as const

const tradespersonTerms = [
  ['1. Introduction', 'These Terms apply to Tradespeople using ZentroFix to access job leads and contact customers.'],
  ['2. Eligibility', ['Be 18 or older', 'Be legally allowed to work in the UK', 'Provide accurate identity and business information', 'Hold appropriate qualifications for regulated work (Gas Safe, NICEIC, etc.)']],
  ['3. Verification', ['Valid ID', 'Proof of address', 'Insurance documents', 'Trade qualifications', 'Business registration details']],
  ['4. Lead Access & Fees', 'Tradespeople may pay a fixed fee (e.g., £1) to unlock customer contact details. Fees are non-refundable, except when the job is fake, the job is a duplicate, contact details are incorrect, or the customer cancels before contact. Refunds, when approved, are issued back to the original payment method.'],
  ['5. Conduct Requirements', ['Communicate professionally', 'Provide accurate quotes', 'Honour appointments where possible', 'Not harass or pressure customers', 'Not attempt to bypass the platform to avoid unlocking fees']],
  ['6. Payments for Work', ['Payments for work are made directly between you and the customer.', 'ZentroFix does not handle or process job payments.', 'ZentroFix is not responsible for payment disputes or non-payment.']],
  ['7. Reviews', ['Customers may leave reviews based on their experience.', 'You may respond professionally.', 'ZentroFix may remove abusive or fraudulent reviews.']],
  ['8. Liability', 'ZentroFix is not responsible for job outcomes, customer behaviour, payment disputes, loss of earnings, work quality complaints, or any agreements made between you and a customer. You are solely responsible for your work and legal compliance.'],
  ['9. Account Suspension', ['Fraud', 'Repeated complaints', 'Abuse or harassment', 'Misrepresentation', 'Violations of these Terms']],
  ['10. Changes to Terms', 'We may update these Terms. Continued use means acceptance.'],
  ['11. Governing Law', 'These Terms are governed by UK law.'],
] as const

export function TermsPage() {
  const { user } = useAuth()
  const [role, setRole] = useState<'homeowner' | 'tradesperson'>(user ? (isHomeowner(user.role) ? 'homeowner' : 'tradesperson') : 'homeowner')
  const sections = role === 'homeowner' ? homeownerTerms : tradespersonTerms
  return <LegalShell eyebrow={`For ${role === 'homeowner' ? 'Homeowners' : 'Tradespeople'}`} title="Terms & Conditions">
    {!user && <div className="legal-role-toggle"><button className={role === 'homeowner' ? 'active' : ''} onClick={() => setRole('homeowner')}>Homeowners</button><button className={role === 'tradesperson' ? 'active' : ''} onClick={() => setRole('tradesperson')}>Tradespeople</button></div>}
    {sections.map(([title, body]) => <LegalSection key={title} number={title.split('.')[0]} title={title.slice(title.indexOf(' ') + 1)}>{Array.isArray(body) ? <BulletList items={[...body]}/> : <p>{body}</p>}</LegalSection>)}
  </LegalShell>
}

const cookieTypes = [
  ['Essential Cookies', 'Required for login, security, and platform functionality.'],
  ['Performance Cookies', 'Help us understand how users interact with the platform.'],
  ['Functional Cookies', 'Remember preferences such as language and location.'],
  ['Advertising Cookies', 'Used for promotions and retargeting (if applicable).'],
]

export function CookiesPage() {
  return <LegalShell eyebrow="How we use cookies" title="Cookie Policy">
    <LegalSection number="1" title="What Are Cookies"><p>Cookies are small files stored on your device to improve your experience.</p></LegalSection>
    <LegalSection number="2" title="Types of Cookies We Use">
      <div className="legal-cookie-list">{cookieTypes.map(([title, text]) => <div key={title}><strong>{title}</strong><p>{text}</p></div>)}</div>
    </LegalSection>
    <LegalSection number="3" title="Third-Party Cookies">
      <p>We may use:</p>
      <BulletList items={['Google Analytics', 'Meta Pixel', 'Payment provider cookies', 'Hosting provider cookies']}/>
    </LegalSection>
    <LegalSection number="4" title="Managing Cookies"><p>You may disable cookies in your browser settings. Essential cookies cannot be disabled.</p></LegalSection>
    <LegalSection number="5" title="Updates"><p>We may update this policy periodically.</p></LegalSection>
  </LegalShell>
}
