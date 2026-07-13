import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { isHomeowner, useAuth } from '../context/AuthContext'
import type { Job } from '../types'
import { GoogleJobMap } from '../components/GoogleJobMap'
import { RestrictedContactPanel } from '../components/RestrictedContactPanel'
import { JobPaymentModal } from '../components/JobPaymentModal'
import { Icon } from '../components/Icon'
import { AppLoader } from '../components/AppLoader'

const progressSteps = [
  { stage: 1, title: 'Service started', text: 'The professional has started working on the job.', icon: 'briefcase' as const },
  { stage: 2, title: 'Service in progress', text: 'Work is underway and the project is being completed.', icon: 'clock' as const },
  { stage: 3, title: 'Service completed', text: 'The job has been marked complete and is ready for review.', icon: 'flag' as const },
]

function resolvedStage(job: Job) {
  if (job.status === 'completed') return 3
  if (job.status === 'in_progress' || job.status === 'ongoing') return Math.max(job.progressStage || 0, 2)
  if (job.status === 'started') return Math.max(job.progressStage || 0, 1)
  return Math.max(0, Math.min(job.progressStage || 0, 3))
}

export function JobProgressPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const homeowner = isHomeowner(user?.role)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { api.job(id).then(setJob).catch(caught => setError(caught instanceof Error ? caught.message : 'Could not load job progress')).finally(() => setLoading(false)) }, [id])

  const owner = job && typeof job.userId === 'object' ? job.userId : undefined
  const assigned = job && typeof job.tradePerson === 'object' ? job.tradePerson : undefined
  const ownerId = job ? (job.userId && typeof job.userId === 'object' ? job.userId._id : job.userId) : undefined
  const assignedId = job ? (job.tradePerson && typeof job.tradePerson === 'object' ? job.tradePerson._id : job.tradePerson) : undefined
  const isOwner = homeowner && ownerId === user?._id
  const isAssigned = !homeowner && assignedId === user?._id
  const canAccess = isOwner || isAssigned
  const stage = job ? resolvedStage(job) : 0
  const paymentRequired = job?.status === 'awarded' && job.paymentStatus !== 'paid'
  const canAdvance = Boolean(job && isAssigned && job.paymentStatus === 'paid' && stage < 3)
  const nextStage = Math.min(stage + 1, 3)

  const statusCopy = useMemo(() => {
    if (!job) return { title: '', text: '' }
    if (stage >= 3) return { title: 'Service completed', text: homeowner ? 'The work is complete. You can now review your experience.' : 'Great work. The homeowner can now leave a review.' }
    if (stage === 2) return { title: 'Job in progress', text: homeowner ? 'Your professional is currently working on this job.' : 'Keep the homeowner updated while you complete the work.' }
    if (stage === 1) return { title: 'Service started', text: homeowner ? 'The professional has marked the service as started.' : 'The job is active. Move it forward when work is underway.' }
    if (paymentRequired) return { title: 'Job awarded', text: homeowner ? 'The professional has been selected. Progress starts after the platform fee is paid.' : 'Your offer was accepted. Complete the platform fee to activate this job.' }
    return { title: 'Ready to start', text: homeowner ? 'The assigned professional can start the service when ready.' : 'Your job is activated and ready to start.' }
  }, [homeowner, job, paymentRequired, stage])

  if (loading) return <AppLoader label="Loading job progress…" />
  if (!job) return <div className="center-state"><p>{error || 'Job not found'}</p><Link className="text-link" to="/jobs?view=my">Back to My Jobs</Link></div>
  if (!canAccess) return <div className="progress-access-denied"><span><Icon name="lock" size={27}/></span><h2>Progress is private</h2><p>Only the job owner and the awarded tradesperson can view this workflow.</p><Link className="button button-primary" to={`/jobs/${job._id}`}>View job details</Link></div>

  const counterpart = homeowner ? assigned : owner
  const counterpartName = counterpart?.name || (homeowner ? 'Assigned professional' : 'Job owner')
  const counterpartImage = counterpart?.profileImage?.url

  const advance = async () => {
    setUpdating(true)
    setError('')
    try { setJob(await api.updateProgress(job._id, nextStage)) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not update progress') }
    finally { setUpdating(false) }
  }

  return <>
    <button className="back-link" onClick={() => navigate(-1)}>← Back to job</button>
    <div className="job-progress-page">
      <header className="progress-page-header">
        <div><span className="eyebrow">Job progress</span><h1>{job.title}</h1><p>{job.locationText || 'Location to be agreed'}</p></div>
        <Link className="button button-ghost" to={`/jobs/${job._id}`}>View job details</Link>
      </header>

      <section className={`progress-hero-card stage-${stage}`}>
        <div className="progress-hero-icon"><Icon name={stage >= 3 ? 'check' : paymentRequired ? 'lock' : stage === 0 ? 'sparkle' : 'briefcase'} size={34}/></div>
        <div><span>{stage >= 3 ? 'Completed' : paymentRequired ? 'Action required' : `Stage ${stage} of 3`}</span><h2>{statusCopy.title}</h2><p>{statusCopy.text}</p></div>
        {paymentRequired && isAssigned && <button className="button button-primary" onClick={() => setPaymentOpen(true)}><Icon name="creditCard" size={17}/> Pay $10 and activate</button>}
        {canAdvance && <button className="button button-primary" disabled={updating} onClick={advance}>{updating ? <><span className="button-spinner"/> Updating…</> : <>{nextStage === 1 ? 'Start service' : nextStage === 2 ? 'Mark in progress' : 'Complete service'} <Icon name="arrow" size={16}/></>}</button>}
        {stage >= 3 && canAccess && <Link className="button button-primary" to={`/jobs/${job._id}`}>Leave a review <Icon name="arrow" size={16}/></Link>}
      </section>

      <section className="progress-tracker-card">
        <div className="progress-tracker-heading"><div><h2>Service timeline</h2><p>Updates are shared with both parties as the work moves forward.</p></div><strong>{Math.round((stage / 3) * 100)}%</strong></div>
        <div className="progress-track"><i style={{ width: `${(stage / 3) * 100}%` }}/></div>
        <div className="progress-timeline">{progressSteps.map((step, index) => {
          const done = stage > step.stage || (stage >= 3 && step.stage === 3)
          const current = !done && stage === step.stage
          const state = done ? 'done' : current ? 'current' : 'upcoming'
          return <div className={`timeline-step ${state}`} key={step.stage}>
            <div className="timeline-marker">
              <span className="timeline-node">{done ? <Icon name="check" size={16}/> : current ? <i className="timeline-pulse"/> : null}</span>
              {index < progressSteps.length - 1 && <i className="timeline-connector"/>}
            </div>
            <div className="timeline-content">
              <div className="timeline-step-head"><h3>{step.title}</h3><b>{done ? 'Completed' : current ? 'In progress' : 'Upcoming'}</b></div>
              <p>{step.text}</p>
            </div>
          </div>
        })}</div>
      </section>

      <div className="progress-information-grid">
        {counterpart && <RestrictedContactPanel jobId={job._id} tradespersonId={homeowner ? assignedId : undefined} fallbackName={counterpartName} profileImage={counterpartImage}/>} 
        <GoogleJobMap job={job} compact />
      </div>
    </div>
    {paymentOpen && <JobPaymentModal job={job} onClose={() => setPaymentOpen(false)} onPaid={paidJob => { setJob({ ...paidJob, userId: job.userId, tradePerson: job.tradePerson }); setPaymentOpen(false) }} />}
  </>
}
