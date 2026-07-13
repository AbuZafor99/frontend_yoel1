import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { isHomeowner, useAuth } from '../context/AuthContext'
import type { Application, Job } from '../types'
import { Modal } from '../components/Modal'
import { statusLabel } from '../components/JobCard'
import { GoogleJobMap } from '../components/GoogleJobMap'
import { RestrictedContactPanel } from '../components/RestrictedContactPanel'
import { Icon } from '../components/Icon'
import { AppLoader } from '../components/AppLoader'
import { showSnackbar } from '../components/FeedbackHost'

function ApplyModal({ job, onClose, onDone }: { job: Job; onClose: () => void; onDone: () => void }) {
  const [price, setPrice] = useState('')
  const [date, setDate] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true)
    try { await api.apply(job._id, { price: Number(price), estimatedStartDate: date || undefined, additionalInfo: info }); onDone() }
    catch { /* API failures are presented by the global snackbar. */ }
    finally { setBusy(false) }
  }
  return <Modal title="Apply for this job" onClose={onClose}><p className="muted">Keep your quote clear and personal contact details inside Zentrofix.</p><form onSubmit={submit} className="form-grid"><label>Your quote<input required type="number" min="0" value={price} onChange={event => setPrice(event.target.value)} placeholder="Amount" /></label><label>Estimated start<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label><label className="span-2">Message<textarea required value={info} onChange={event => setInfo(event.target.value)} placeholder="Tell the homeowner why you’re a good fit" /></label><button className="button button-primary span-2" disabled={busy}>{busy ? <><span className="button-spinner"/> Sending…</> : 'Send application'}</button></form></Modal>
}

function ReviewForm({ job }: { job: Job }) {
  const [stars, setStars] = useState(5)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); try { await api.reviews(job._id, stars, text); setSent(true); showSnackbar('Thanks for sharing your feedback.', 'success') } catch { /* Global snackbar handles the error. */ } finally { setBusy(false) } }
  if (sent) return <div className="notice success-notice">Thanks for sharing your feedback.</div>
  return <form className="review-form" onSubmit={submit}><span className="eyebrow">Leave a review</span><div className="stars">{[1,2,3,4,5].map(value => <button type="button" key={value} onClick={() => setStars(value)} className={value <= stars ? 'star selected' : 'star'}>★</button>)}</div><textarea required value={text} onChange={event => setText(event.target.value)} placeholder="How did the work go?"/><button className="button button-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit review'}</button></form>
}

function ApplicantInfoModal({ application, jobId, onClose }: { application: Application; jobId: string; onClose: () => void }) {
  const person = typeof application.tradespersonId === 'object' ? application.tradespersonId : undefined
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
    const person = typeof application.tradespersonId === 'object' ? application.tradespersonId : undefined
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
  const [applyOpen, setApplyOpen] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { Promise.all([api.job(id), homeowner ? api.applicants(id) : Promise.resolve([])]).then(([nextJob,nextApps]) => { setJob(nextJob); setApplications(nextApps as Application[]) }).catch(caught => setLoadError(caught instanceof Error ? caught.message : 'Could not load job')).finally(() => setLoading(false)) }, [id,homeowner])
  if (loading) return <AppLoader label="Loading job details…" />
  if (!job) return <div className="center-state"><p>{loadError || 'Job not found'}</p><Link className="text-link" to="/jobs">Back to jobs</Link></div>

  const owner = typeof job.userId === 'object' ? job.userId : undefined
  const assigned = typeof job.tradePerson === 'object' ? job.tradePerson : undefined
  const assignedId = typeof job.tradePerson === 'object' ? job.tradePerson._id : job.tradePerson
  const canApply = !homeowner && job.status === 'pending'
  const progressStatuses = ['awarded','active','started','ongoing','in_progress','completed']
  const showProgress = progressStatuses.includes(job.status || '') && (homeowner || assignedId === user?._id)
  const cancellable = homeowner && ['pending','open_to_quotes','awarded'].includes(job.status || 'pending')

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
        <div className="detail-hero"><div><span className="eyebrow">{typeof job.categoryId === 'object' ? job.categoryId.name : 'Local job'}</span><h1>{job.title}</h1><div className="job-meta"><span><Icon name="map" size={15}/>{job.locationText || 'Location to be agreed'}</span><span><Icon name="calendar" size={15}/>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently posted'}</span></div></div><span className={`status status-${job.status || 'pending'}`}>{statusLabel(job.status)}</span></div>
        {showProgress && <section className="detail-progress-callout"><span><Icon name={job.status === 'completed' ? 'check' : 'clock'} size={22}/></span><div><h2>{job.status === 'completed' ? 'Service completed' : job.status === 'awarded' ? 'Job awarded' : 'Service is underway'}</h2><p>Open the progress screen to follow status updates and next actions.</p></div><Link className="button button-primary" to={`/jobs/${job._id}/progress`}>Track progress <Icon name="arrow" size={16}/></Link></section>}
        <section className="detail-section"><h2>About this job</h2><p className="detail-description">{job.description || 'No additional description provided.'}</p>{job.media?.length ? <div className="media-strip">{job.media.map(url => <img key={url} src={url} alt="Job attachment"/>)}</div> : null}</section>
        <section className="detail-section"><GoogleJobMap job={job}/></section>
        {homeowner && <section className="detail-section"><h2>Applications and offers</h2><p className="muted">Review each professional’s profile and quote. Contact details remain protected until award and payment.</p><ApplicantList applications={applications} jobId={job._id} onDecision={decide}/></section>}
        {!homeowner && !showProgress && <section className="detail-section"><div className="notice">Progress tracking becomes available if the homeowner accepts your offer.</div></section>}
        {homeowner && job.status === 'completed' && <section className="detail-section"><ReviewForm job={job}/></section>}
      </article>
      <aside className="detail-sidebar">
        <div className="price-card"><span className="eyebrow">Budget / quote</span><strong>{job.budget ? `£${job.budget}` : 'Open to quotes'}</strong><small>{job.paymentStatus === 'paid' ? 'Platform fee paid · Contact unlocked' : job.status === 'awarded' ? 'Awarded · Awaiting platform fee' : 'Discuss details in messages'}</small>{!homeowner && <button className="button button-primary full-button" disabled={!canApply} onClick={() => setApplyOpen(true)}>{canApply ? 'Apply for this job' : assignedId === user?._id ? 'Your offer was accepted' : 'Applications closed'}</button>}{cancellable && <button className="button button-ghost full-button" onClick={() => api.updateJobStatus(job._id,'cancelled').then(next => { setJob(next); showSnackbar('Job cancelled.', 'success') }).catch(() => undefined)}>Cancel job</button>}</div>
        {!homeowner && owner && <RestrictedContactPanel jobId={job._id} fallbackName={owner.name} profileImage={owner.profileImage?.url}/>} 
        {homeowner && assignedId && <RestrictedContactPanel jobId={job._id} tradespersonId={assignedId} fallbackName={assigned?.name} profileImage={assigned?.profileImage?.url}/>} 
        <div className="info-card"><span className="eyebrow">Safety first</span><h3>Keep your work on Zentrofix.</h3><p>Use platform messaging. Phone and email are automatically unlocked only after award and payment.</p></div>
      </aside>
    </div>
    {applyOpen && <ApplyModal job={job} onClose={() => setApplyOpen(false)} onDone={() => { setApplyOpen(false); showSnackbar('Application sent. The homeowner will review your quote.', 'success') }}/>} 
  </>
}
