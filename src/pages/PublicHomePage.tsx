import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Category, Job } from '../types'
import { JobCard } from '../components/JobCard'
import { Icon } from '../components/Icon'

export function PublicHomePage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    api.categories().then(setCategories).catch(() => undefined)
    api.publicJobs('?page=1&limit=6', true).then(setJobs).catch(caught => {
      // Older deployed backends do not yet expose `/jobs/public`; keep the
      // landing page usable and show a neutral placeholder instead of an ID error.
      if (!(caught instanceof Error) || !/invalid id/i.test(caught.message)) setError(caught instanceof Error ? caught.message : 'Could not load jobs')
    })
  }, [])
  const search = (event: React.FormEvent) => { event.preventDefault(); navigate(`/auth?intent=search&query=${encodeURIComponent(query)}`) }

  return <div className="public-page">
    <header className="public-nav">
      <Link className="public-logo" to="/"><img src="/app-assets/homeLogo.png" alt="Zentrofix" /></Link>
      <nav><a href="#how-it-works">How it works</a><a href="#jobs">Browse jobs</a><a href="#services">Services</a></nav>
      <div><Link className="button button-ghost" to="/auth?mode=login">Sign in</Link><Link className="button button-primary" to="/auth?mode=register">Get started <Icon name="arrow" size={16}/></Link></div>
    </header>

    <main>
      <section className="public-hero">
        <div className="public-hero-copy">
          <span className="hero-kicker"><Icon name="shield" size={16}/> Trusted local professionals</span>
          <h1>Get your home jobs done with confidence.</h1>
          <p>Post the work you need, connect with skilled local tradespeople and manage every step in one simple place.</p>
          <form className="search-hero" onSubmit={search}><Icon name="search" size={20}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="What do you need help with?" /><button className="button button-primary">Find help</button></form>
          <div className="hero-proof"><span><Icon name="check" size={15}/> Verified professionals</span><span><Icon name="check" size={15}/> Secure conversations</span><span><Icon name="check" size={15}/> Clear job progress</span></div>
        </div>
        <div className="public-hero-visual">
          <img src="/app-assets/home1.png" alt="A home project completed by a local professional" />
          <div className="visual-rating"><span><Icon name="star" size={18}/></span><div><strong>Trusted by local customers</strong><small>Quality work, clearly reviewed</small></div></div>
          <div className="visual-match"><span><Icon name="users" size={20}/></span><div><strong>Professionals near you</strong><small>Matched to your job and location</small></div></div>
        </div>
      </section>

      <section className="public-section" id="jobs">
        <div className="public-section-heading"><div><span className="eyebrow">Open opportunities</span><h2>Recent jobs in the community</h2><p>See the kind of work moving through Zentrofix every day.</p></div><Link className="text-link" to="/auth?intent=browse">Browse all jobs <Icon name="arrow" size={16}/></Link></div>
        {jobs.length ? <div className="public-job-grid">{jobs.map(job => <JobCard key={job._id} job={job} compact />)}</div> : <div className="public-placeholder">{error ? 'Jobs could not be loaded. Please try again shortly.' : 'New opportunities will appear here shortly.'}</div>}
      </section>

      <section className="public-section public-services" id="services">
        <div className="public-section-heading"><div><span className="eyebrow">Find the right expertise</span><h2>Start with a service</h2></div></div>
        <div className="category-grid">{categories.slice(0, 6).map(category => <Link to={`/auth?intent=browse&category=${category._id}`} className="category-tile" key={category._id}><span className="category-icon"><Icon name="sparkle" size={20}/></span><strong>{category.name}</strong><small>Find specialists in your area</small><Icon name="arrow" size={17}/></Link>)}</div>
      </section>

      <section className="public-how" id="how-it-works">
        <div className="public-how-copy"><span className="eyebrow">Simple from start to finish</span><h2>One clear workflow for better local work.</h2><p>Everything stays connected—from the first job post to the final review.</p><Link className="button button-light" to="/auth?mode=register">Create your free account <Icon name="arrow" size={16}/></Link></div>
        <div className="public-step-list">{[['01','Post your job','Share the details, budget and location.'],['02','Choose with confidence','Compare responses and talk securely.'],['03','Follow the work','Track progress and leave a trusted review.']].map(([number,title,text]) => <article key={number}><span>{number}</span><div><strong>{title}</strong><small>{text}</small></div></article>)}</div>
      </section>
    </main>

    <footer className="public-footer"><img src="/app-assets/homeLogo.png" alt="Zentrofix"/><span>Better connections for better homes.</span><span>© {new Date().getFullYear()} Zentrofix</span></footer>
  </div>
}
