import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { isHomeowner, useAuth } from '../context/AuthContext'
import type { CarouselItem, Conversation, Job } from '../types'
import { JobCard } from '../components/JobCard'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { HorizontalJobRail } from '../components/HorizontalJobRail'
import { AppLoader } from '../components/AppLoader'
import { KycUnverifiedBanner } from '../components/KycBanner'

const homeownerSlides: CarouselItem[] = [
  { _id: 'owner-1', title: 'The right professional for every job.', subtitle: 'Post your project, compare trusted local professionals and manage everything in one place.', image: { url: '/app-assets/home1.png' } },
  { _id: 'owner-2', title: 'Turn your to-do list into done.', subtitle: 'From quick repairs to bigger improvements, find reliable help near you.', image: { url: '/app-assets/home3.png' } },
]
const tradespersonSlides: CarouselItem[] = [
  { _id: 'trade-1', title: 'Great local jobs, matched to your skills.', subtitle: 'Discover nearby opportunities, send clear quotes and keep every project moving.', image: { url: '/app-assets/home2.png' } },
  { _id: 'trade-2', title: 'Build a reputation that wins more work.', subtitle: 'Deliver great service, collect reviews and grow your business with confidence.', image: { url: '/app-assets/home3.png' } },
]

const benefits = [
  ['shield' as const, 'Quality work you can trust', 'Connect with skilled, reviewed professionals for every job.'],
  ['users' as const, 'Local professionals you can count on', 'Find dependable people who already work near your area.'],
  ['lock' as const, 'Safe, secure and easy to use', 'Keep quotes, messages and project progress in one workflow.'],
  ['heart' as const, 'Better connections. Better homes.', 'Build trusted working relationships that last beyond one job.'],
] as const

function RecentMessages({ conversations, userId }: { conversations: Conversation[]; userId?: string }) {
  return <section className="home-section recent-message-section">
    <div className="app-section-title"><h2>Recent Messages</h2><Link to="/chat">View All</Link></div>
    {conversations.length ? <div className="message-preview-list">{conversations.slice(0, 3).map(conversation => {
      const other = conversation.participants?.find(person => person._id !== userId)
      return <Link to={`/chat?conversation=${conversation._id}`} className="message-preview" key={conversation._id}>
        <span className="message-avatar">{(other?.name || 'Z').slice(0, 1).toUpperCase()}</span>
        <span><strong>{other?.name || 'Zentrofix member'}</strong><small>{conversation.lastMessageText || 'Open the conversation to get started.'}</small></span>
        <time>{conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Now'}</time>
      </Link>
    })}</div> : <div className="message-empty-inline"><span><Icon name="message" size={23}/></span><p>Your recent job conversations will appear here.</p><Link to="/chat">Open messages <Icon name="arrow" size={14}/></Link></div>}
  </section>
}

export function DashboardPage() {
  const { user } = useAuth()
  const homeowner = isHomeowner(user?.role)
  const [jobs, setJobs] = useState<Job[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const fallbackSlides = homeowner ? homeownerSlides : tradespersonSlides
  const [slides, setSlides] = useState<CarouselItem[]>(fallbackSlides)
  const [slide, setSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setSlides(homeowner ? homeownerSlides : tradespersonSlides)
    setSlide(0)
    Promise.all([
      homeowner ? api.myJobs() : api.nearJobs('?page=1&limit=10'),
      api.conversations(true).catch(() => []),
      api.carousels(true).catch(() => ({ items: [] })),
    ]).then(([nextJobs, nextConversations, carousel]) => {
      setJobs(nextJobs)
      setConversations(nextConversations)
      if (carousel.items?.length) setSlides(carousel.items)
    }).catch(caught => setError(caught instanceof Error ? caught.message : 'Could not load home')).finally(() => setLoading(false))
  }, [homeowner])

  useEffect(() => {
    const timer = window.setInterval(() => setSlide(current => (current + 1) % slides.length), 5000)
    return () => window.clearInterval(timer)
  }, [slides.length])

  const activeSlide = slides[slide] || fallbackSlides[0]
  const steps = useMemo(() => homeowner ? [
    ['Post Your Job', 'Tell us what you need done.'],
    ['Find Pros', 'Browse trusted professionals.'],
    ['Review & Hire', 'Choose verified pros with reviews.'],
    ['Get It Done', 'Sit back and enjoy quality work.'],
  ] : [
    ['Find Jobs', 'Browse jobs near you and match your skills.'],
    ['Accept & Quote', 'Apply and send your best quote.'],
    ['Do the Work', 'Complete the job with quality service.'],
    ['Get Paid & Rated', 'Build your reputation through great work.'],
  ], [homeowner])

  return <>
    <section className="home-carousel" style={{ backgroundImage: `linear-gradient(90deg, rgba(5,28,63,.94) 0%, rgba(5,35,75,.74) 44%, rgba(5,35,75,.08) 78%), url("${activeSlide.image?.url || '/app-assets/home1.png'}")` }}>
      <div className="carousel-copy"><span>{activeSlide.type === 'coupon' ? `${activeSlide.discountPercentage || ''}% offer` : homeowner ? 'Home services made simple' : 'Local work, all in one place'}</span><h1>{activeSlide.title}</h1><p>{activeSlide.subtitle || 'Trusted local work, managed from start to finish.'}</p>{!homeowner && <Link className="button carousel-button" to="/jobs?view=discover">Find Jobs</Link>}</div>
      <button className="carousel-arrow previous" onClick={() => setSlide(current => (current - 1 + slides.length) % slides.length)} aria-label="Previous slide">‹</button>
      <button className="carousel-arrow next" onClick={() => setSlide(current => (current + 1) % slides.length)} aria-label="Next slide">›</button>
      <div className="carousel-dots">{slides.map((item, index) => <button key={item._id} className={index === slide ? 'active' : ''} onClick={() => setSlide(index)} aria-label={`Slide ${index + 1}`} />)}</div>
    </section>

    {!homeowner && !user?.isKycVerified && <KycUnverifiedBanner />}

    <section className="home-section jobs-rail-section">
      <div className="app-section-title"><h2>{homeowner ? 'My Jobs' : 'Job Near You'}</h2><Link to={homeowner ? '/jobs?view=my' : '/jobs?view=discover'}>View All</Link></div>
      {loading ? <AppLoader label={homeowner ? 'Loading your jobs…' : 'Finding jobs near you…'} /> : jobs.length ? <HorizontalJobRail label={homeowner ? 'My jobs' : 'Jobs near you'}>{jobs.slice(0, 10).map(job => <JobCard job={job} progressAware={homeowner} key={job._id} />)}</HorizontalJobRail> : <EmptyState title={error ? 'Jobs could not be loaded' : homeowner ? 'No jobs yet' : 'No nearby jobs yet'} text={error ? 'Please try again in a moment.' : homeowner ? 'Post your first job and local professionals can start responding.' : 'New work near your service area will appear here.'} action={homeowner ? <Link className="button button-primary" to="/jobs/new">Post a job</Link> : undefined} />}
    </section>

    <RecentMessages conversations={conversations} userId={user?._id} />

    <section className="home-section why-section">
      <div className="centered-section-title"><h2>Why Choose Zentrofix?</h2><p>A trusted place for homeowners and professionals to get good work done.</p></div>
      <div className="benefit-grid">{benefits.map(([icon, title, text]) => <article key={title}><span><Icon name={icon} size={23}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="home-section app-how-section">
      <div className="centered-section-title"><h2>How It Works</h2><p>{homeowner ? 'Post a job and choose the right professional in four simple steps.' : 'Find suitable work and build your reputation in four simple steps.'}</p></div>
      <div className="app-step-grid">{steps.map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{text}</p></div>{index < steps.length - 1 && <i><Icon name="arrow" size={18}/></i>}</article>)}</div>
    </section>
  </>
}
