import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { isHomeowner, useAuth } from '../context/AuthContext'
import type { Application, Job, Review } from '../types'
import { Modal } from '../components/Modal'
import { statusLabel } from '../components/JobCard'
import { GoogleJobMap } from '../components/GoogleJobMap'
import { RestrictedContactPanel } from '../components/RestrictedContactPanel'
import { Icon } from '../components/Icon'
import { AppLoader } from '../components/AppLoader'
import { showSnackbar } from '../components/FeedbackHost'

function ApplyModal({ job, onClose, onDone }: { job: Job; onClose: () => void; onDone: (application: Application) => void }) {
  const [price, setPrice] = useState('')
  const [date, setDate] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true)
    try { const application = await api.apply(job._id, { price: Number(price), estimatedStartDate: date || undefined, additionalInfo: info }); onDone(application) }
    catch { /* API failures are presented by the global snackbar. */ }
    finally { setBusy(false) }
  }
  return <Modal title="Apply for this job" onClose={onClose}><p className="muted">Keep your quote clear and personal contact details inside Zentrofix.</p><form onSubmit={submit} className="form-grid"><label>Your quote<input required type="number" min="0" value={price} onChange={event => setPrice(event.target.value)} placeholder="Amount" /></label><label>Estimated start<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label><label className="span-2">Message<textarea required value={info} onChange={event => setInfo(event.target.value)} placeholder="Tell the homeowner why you’re a good fit" /></label><button className="button button-primary span-2" disabled={busy}>{busy ? <><span className="button-spinner"/> Sending…</> : 'Send application'}</button></form></Modal>
}

function ReviewForm({ job, onSubmitted }: { job: Job; onSubmitted: (review: Review) => void }) {
  const [stars, setStars] = useState(5)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); try { const review = await api.reviews(job._id, stars, text); onSubmitted(review as unknown as Review); showSnackbar('Thanks for sharing your feedback.', 'success') } catch { /* Global snackbar handles the error. */ } finally { setBusy(false) } }
  return <form className="review-form" onSubmit={submit}><span className="eyebrow">Leave a review</span><div className="stars">{[1,2,3,4,5].map(value => <button type="button" key={value} onClick={() => setStars(value)} className={value <= stars ? 'star selected' : 'star'}>★</button>)}</div><textarea required value={text} onChange={event => setText(event.target.value)} placeholder="How did the work go?"/><button className="button button-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit review'}</button></form>
}

function MyReviewCard({ review }: { review: Review }) {
  return <div className="review-form submitted-review"><span className="eyebrow">Your review</span><div className="stars readonly">{[1,2,3,4,5].map(value => <span key={value} className={value <= review.stars ? 'star selected' : 'star'}>★</span>)}</div>{review.text && <p className="submitted-review-text">{review.text}</p>}<div className="notice success-notice">Thanks for sharing your feedback.</div></div>
}

function MyApplicationCard({ application }: { application: Application }) {
  const labels: Record<string, string> = { pending: 'Awaiting response', lost: 'Not selected', active: 'Accepted' }
  return <div className="notice my-application-card"><div className="my-application-head"><span className="eyebrow">Your application</span><span className={`status status-${application.status}`}>{labels[application.status] || application.status}</span></div><strong>{application.price ? `£${application.price}` : 'Quote pending'}</strong>{application.estimatedStartDate && <small>Available from {new Date(application.estimatedStartDate).toLocaleDateString()}</small>}<p>{application.additionalInfo || 'No additional message supplied.'}</p></div>
}

function ApplicantInfoModal({ application, jobId, onClose }: { application: Application; jobId: string; onClose: () => void }) {
  const person = application.tradespersonId && typeof application.tradespersonId === 'object' ? application.tradespersonId : undefined
  const personId = person?._id || (typeof application.tradespersonId === 'string' ? application.tradespersonId : '')
  return <Modal title="Tradesperson information" onClose={onClose}>
    <div className="applicant-profile-summary"><span className="restricted-avatar">{person?.profileImage?.url ? <img src={person.profileImage.url} alt=""/> : (person?.name || 'T').slice(0,1)}</span><div><h3>{person?.name || 'Tradesperson'}</h3><p>{person?.bio || 'Zentrofix professional'}</p><span><Icon name="star" size={14}/> {person?.ratingSummary?.avg?.toFixed(1) || 'New'} {person?.ratingSummary?.count ? `(${person.ratingSummary.count} reviews)` : ''}</span></div></div>
    <div className="application-offer-card"><span>Offer</span><strong>{application.price ? `£${application.price}` : 'Quote pending'}</strong>{application.estimatedStartDate && <small>Available from {new Date(application.estimatedStartDate).toLocaleDateString()}</small>}<p>{application.additionalInfo || 'No additional message supplied.'}</p></div>
    {personId && <RestrictedContactPanel jobId={jobId} tradespersonId={personId} fallbackName={person?.name} profileImage={person?.profileImage?.url}/>} 
  </Modal>
}

function ApplicantList({ applications, jobId, onDecision }: { applications: Application[]; jobId: string; onDecision: (application: Application, action: 'accept' | 'decline') => void }) {
  const [selected, setSelected] = useState<Application | null>(null)
  return <><div className="applicant-list">{applications.length ? applications.map(application => {
    const person = application.tradespersonId && typeof application.tradespersonId === 'object' ? application.tradespersonId : undefined
    return <div className="applicant-row" key={application._id}><span className="avatar avatar-purple">{person?.profileImage?.url ? <img src={person.profileImage.url} alt=""/> : (person?.name || 'T').slice(0,1)}</span><div><strong>{person?.name || 'Tradesperson'}</strong><small>{application.additionalInfo || 'Application received'} · {application.price ? `£${application.price}` : 'Quote pending'}</small></div><span className="row-actions"><button className="button button-ghost small-button" onClick={() => setSelected(application)}>View info</button>{application.status === 'pending' && <><button className="button button-ghost small-button" onClick={() => onDecision(application,'decline')}>Decline</button><button className="button button-primary small-button" onClick={() => onDecision(application,'accept')}>Accept offer</button></>}</span></div>
  }) : <p className="muted">No applications yet. They’ll appear here as tradespeople respond.</p>}</div>{selected && <ApplicantInfoModal application={selected} jobId={jobId} onClose={() => setSelected(null)}/>}</>
}

export function JobDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const homeowner = isHomeowner(user?.role)
  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [myApplication, setMyApplication] = useState<Application | null>(null)
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [applyOpen, setApplyOpen] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.job(id),
      homeowner ? api.applicants(id) : Promise.resolve([]),
      // A tradesperson's own application record isn't in the job payload, so we
      // fetch their applications separately to know if they've already applied
      // (and to their price/message) instead of showing a re-apply form.
      !homeowner ? api.applications().catch(() => []) : Promise.resolve([]),
    ]).then(([nextJob, nextApps, myApps]) => {
      setJob(nextJob)
      setApplications(nextApps as Application[])
      const mine = (myApps as Application[]).find(application => (application.jobId && typeof application.jobId === 'object' ? application.jobId._id : application.jobId) === id)
      setMyApplication(mine || null)
    }).catch(caught => setLoadError(caught instanceof Error ? caught.message : 'Could not load job')).finally(() => setLoading(false))
  }, [id, homeowner])

  useEffect(() => {
    if (!job || job.status !== 'completed') { setMyReview(null); return }
    api.jobReviews(job._id).then(reviews => setMyReview(reviews.find(review => review.userId === user?._id) || null)).catch(() => undefined)
  }, [job?._id, job?.status, user?._id])

  if (loading) return <AppLoader label="Loading job details…" />
  if (!job) return <div className="center-state"><p>{loadError || 'Job not found'}</p><Link className="text-link" to="/jobs">Back to jobs</Link></div>

  const owner = job.userId && typeof job.userId === 'object' ? job.userId : undefined
  const ownerId = job.userId && typeof job.userId === 'object' ? job.userId._id : job.userId
  const assigned = job.tradePerson && typeof job.tradePerson === 'object' ? job.tradePerson : undefined
  const assignedId = job.tradePerson && typeof job.tradePerson === 'object' ? job.tradePerson._id : job.tradePerson
  const canApply = !homeowner && job.status === 'pending' && !myApplication
  const progressStatuses = ['awarded','active','started','ongoing','in_progress','completed']
  const showProgress = progressStatuses.includes(job.status || '') && (homeowner || assignedId === user?._id)
  const cancellable = homeowner && ['pending','open_to_quotes','awarded'].includes(job.status || 'pending')
  const isReviewParty = job.status === 'completed' && (homeowner ? ownerId === user?._id : assignedId === user?._id)

  const decide = async (application: Application, action: 'accept' | 'decline') => {
    try {
      const result = await api.decideApplication(application._id,action)
      setApplications(current => current.map(item => item._id === application._id ? { ...item, status: action === 'accept' ? 'active' : 'lost' } : action === 'accept' && item.status === 'pending' ? { ...item, status:'lost' } : item))
      if (action === 'accept' && 'job' in result) setJob(result.job)
      showSnackbar(action === 'accept' ? 'Offer accepted and job awarded.' : 'Application declined.', 'success')
    } catch { /* API failures are presented by the global snackbar. */ }
  }

  return <>
    <button className="back-link" onClick={() => navigate(-1)}>← Back</button>
    <div className="detail-layout">
      <article className="detail-main">
        <div className="detail-hero"><div><span className="eyebrow">{job.categoryId && typeof job.categoryId === 'object' ? job.categoryId.name : 'Local job'}</span><h1>{job.title}</h1><div className="job-meta"><span><Icon name="map" size={15}/>{job.locationText || 'Location to be agreed'}</span><span><Icon name="calendar" size={15}/>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently posted'}</span></div></div><span className={`status status-${job.status || 'pending'}`}>{statusLabel(job.status)}</span></div>
        {showProgress && <section className="detail-progress-callout"><span><Icon name={job.status === 'completed' ? 'check' : 'clock'} size={22}/></span><div><h2>{job.status === 'completed' ? 'Service completed' : job.status === 'awarded' ? 'Job awarded' : 'Service is underway'}</h2><p>Open the progress screen to follow status updates and next actions.</p></div><Link className="button button-primary" to={`/jobs/${job._id}/progress`}>Track progress <Icon name="arrow" size={16}/></Link></section>}
        <section className="detail-section"><h2>About this job</h2><p className="detail-description">{job.description || 'No additional description provided.'}</p>{job.media?.length ? <div className="media-strip">{job.media.map(url => <img key={url} src={url} alt="Job attachment"/>)}</div> : null}</section>
        <section className="detail-section"><GoogleJobMap job={job}/></section>
        {homeowner && <section className="detail-section"><h2>Applications and offers</h2><p className="muted">Review each professional’s profile and quote. Contact details remain protected until award and payment.</p><ApplicantList applications={applications} jobId={job._id} onDecision={decide}/></section>}
        {!homeowner && myApplication && !showProgress && <section className="detail-section"><MyApplicationCard application={myApplication}/></section>}
        {!homeowner && !showProgress && !myApplication && <section className="detail-section"><div className="notice">Progress tracking becomes available if the homeowner accepts your offer.</div></section>}
        {isReviewParty && <section className="detail-section">{myReview ? <MyReviewCard review={myReview}/> : <ReviewForm job={job} onSubmitted={setMyReview}/>}</section>}
      </article>
      <aside className="detail-sidebar">
        <div className="price-card"><span className="eyebrow">Budget / quote</span><strong>{job.budget ? `£${job.budget}` : 'Open to quotes'}</strong><small>{job.paymentStatus === 'paid' ? 'Platform fee paid · Contact unlocked' : job.status === 'awarded' ? 'Awarded · Awaiting platform fee' : 'Discuss details in messages'}</small>{!homeowner && <button className="button button-primary full-button" disabled={!canApply} onClick={() => setApplyOpen(true)}>{assignedId === user?._id ? 'Your offer was accepted' : myApplication?.status === 'pending' ? 'Application submitted' : myApplication?.status === 'lost' ? 'Not selected' : canApply ? 'Apply for this job' : 'Applications closed'}</button>}{cancellable && <button className="button button-ghost full-button" onClick={() => api.updateJobStatus(job._id,'cancelled').then(next => { setJob(next); showSnackbar('Job cancelled.', 'success') }).catch(() => undefined)}>Cancel job</button>}</div>
        {!homeowner && owner && <RestrictedContactPanel jobId={job._id} fallbackName={owner.name} profileImage={owner.profileImage?.url}/>} 
        {homeowner && assignedId && <RestrictedContactPanel jobId={job._id} tradespersonId={assignedId} fallbackName={assigned?.name} profileImage={assigned?.profileImage?.url}/>} 
        <div className="info-card"><span className="eyebrow">Safety first</span><h3>Keep your work on Zentrofix.</h3><p>Use platform messaging. Phone and email are automatically unlocked only after award and payment.</p></div>
      </aside>
    </div>
    {applyOpen && <ApplyModal job={job} onClose={() => setApplyOpen(false)} onDone={application => { setMyApplication(application); setApplyOpen(false); showSnackbar('Application sent. The homeowner will review your quote.', 'success') }}/>}
  </>
}
