import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { CarouselItem, Job } from '../types'
import { jobImage } from '../components/JobCard'
import { Icon } from '../components/Icon'
import { Footer } from '../components/Footer'

// Web counterpart of the app's GuestHomeScreen — the default landing shown to
// logged-out visitors. Browsing (banner carousel + latest jobs) works without an
// account; anything account-scoped (a job's details) sends the visitor to login.

const whyChoose = [
  { icon: 'shield' as const, tone: 'blue', label: 'Quality Work You Can Trust' },
  { icon: 'users' as const, tone: 'green', label: 'Local Professionals You Can Count On' },
  { icon: 'lock' as const, tone: 'blue', label: 'Safe, Secure & Easy to Use' },
  { icon: 'home' as const, tone: 'blue', label: 'Better Connections, Better Homes' },
]

const howItWorks = [
  { icon: 'message' as const, title: 'Post Your Job', subtitle: 'Tell us what you need done.' },
  { icon: 'search' as const, title: 'Find Pros', subtitle: 'Browse trusted professionals.' },
  { icon: 'shield' as const, title: 'Review & Hire', subtitle: 'Choose verified pros with reviews.' },
  { icon: 'check' as const, title: 'Get It Done', subtitle: 'Sit back and enjoy quality work.' },
]

function BannerCarousel({ items }: { items: CarouselItem[] }) {
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (items.length < 2) return
    const timer = window.setInterval(() => setActive(current => (current + 1) % items.length), 4000)
    return () => window.clearInterval(timer)
  }, [items.length])
  if (!items.length) return null
  const current = Math.min(active, items.length - 1)
  return <section className="guest-banner">
    <div className="guest-banner-track" style={{ transform: `translateX(-${current * 100}%)` }}>
      {items.map(item => {
        const discount = item.type === 'coupon' && item.discountPercentage ? item.discountPercentage : null
        const slide = <>
          {item.image?.url && <img className="guest-banner-photo" src={item.image.url} alt="" />}
          <div className="guest-banner-overlay" />
          <div className="guest-banner-copy">
            {discount ? <span className="guest-banner-badge">{discount}% OFF</span> : null}
            <h3>{item.title}</h3>
            {item.subtitle ? <p>{item.subtitle}</p> : null}
            <span className="guest-banner-brand"><img src="/zentrofix-app-icon.png" alt="" />ZENTROFIX</span>
          </div>
        </>
        return item.link
          ? <a key={item._id} className="guest-banner-slide" href={item.link} target="_blank" rel="noreferrer">{slide}</a>
          : <div key={item._id} className="guest-banner-slide">{slide}</div>
      })}
    </div>
    {items.length > 1 && <div className="guest-banner-dots">
      {items.map((item, index) => <button key={item._id} className={index === current ? 'active' : ''} aria-label={`Go to slide ${index + 1}`} onClick={() => setActive(index)} />)}
    </div>}
  </section>
}

function GuestJobCard({ job }: { job: Job }) {
  const categoryName = job.categoryId && typeof job.categoryId === 'object' ? job.categoryId.name : job.category?.name
  // Links into the protected job route → the auth gate redirects guests to
  // login, matching the app's "log in to view job details" prompt.
  return <Link to={`/jobs/${job._id}`} className="guest-job-card">
    <div className="guest-job-photo"><img src={jobImage(job)} alt="" /></div>
    <div className="guest-job-body">
      <strong>{job.title}</strong>
      <small>{categoryName || 'General work'}</small>
      <span className="guest-job-budget">{job.budget ? `£${job.budget}` : 'Quote requested'}</span>
      <span className="guest-job-location"><Icon name="map" size={13}/>{job.locationText || '—'}</span>
    </div>
  </Link>
}

export function PublicHomePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [banners, setBanners] = useState<CarouselItem[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)

  useEffect(() => {
    api.carousels(true).then(response => setBanners(response.items || [])).catch(() => undefined)
    api.publicJobs('?page=1&limit=10', true)
      .then(setJobs)
      .catch(() => undefined)
      .finally(() => setJobsLoading(false))
  }, [])

  return <div className="guest-home">
    <header className="guest-header">
      <Link className="guest-logo" to="/"><img src="/app-assets/homeLogo.png" alt="Zentrofix" /></Link>
      <Link className="guest-signin" to="/auth?mode=login">Log In / Sign Up</Link>
    </header>

    <main className="guest-main">
      <BannerCarousel items={banners} />

      <section className="guest-section">
        <div className="guest-section-head"><h2>Latest Jobs</h2><Link className="guest-see-all" to="/auth?intent=browse">See all <Icon name="arrow" size={15}/></Link></div>
        {jobsLoading
          ? <div className="guest-job-rail">{[0, 1, 2].map(index => <div key={index} className="guest-job-card skeleton"><div className="guest-job-photo"/><div className="guest-job-body"><span className="sk sk-title"/><span className="sk sk-line"/><span className="sk sk-price"/></div></div>)}</div>
          : jobs.length
            ? <div className="guest-job-rail">{jobs.map(job => <GuestJobCard key={job._id} job={job} />)}</div>
            : <p className="guest-empty">No jobs available right now.</p>}
      </section>

      <section className="guest-section">
        <div className="guest-section-head"><h2>Why Choose Zentrofix?</h2><span className="guest-section-note">Verified &amp; Trusted Professionals</span></div>
        <div className="guest-why-grid">
          {whyChoose.map(item => <div className="guest-why-card" key={item.label}>
            <span className={`guest-why-icon tone-${item.tone}`}><Icon name={item.icon} size={26}/></span>
            <small>{item.label}</small>
          </div>)}
        </div>
      </section>

      <section className="guest-section">
        <div className="guest-section-head"><h2>How It Works</h2></div>
        <div className="guest-steps">
          {howItWorks.map((step, index) => <div className="guest-step-wrap" key={step.title}>
            <div className="guest-step">
              <span className="guest-step-mark"><Icon name={step.icon} size={24}/><b>{index + 1}</b></span>
              <strong>{step.title}</strong>
              <small>{step.subtitle}</small>
            </div>
            {index < howItWorks.length - 1 && <span className="guest-step-arrow"><Icon name="arrow" size={16}/></span>}
          </div>)}
        </div>
      </section>

      <section className="guest-cta">
        <h2>Ready to get your home jobs done?</h2>
        <p>Join Zentrofix to post jobs, message trusted local professionals and track every step.</p>
        <Link className="button button-primary" to="/auth?mode=register">Get started <Icon name="arrow" size={16}/></Link>
      </section>
    </main>

    <Footer/>
  </div>
}
