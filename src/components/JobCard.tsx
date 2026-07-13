import { Link } from 'react-router-dom'
import { apiBase } from '../api/client'
import type { Job } from '../types'
import { Icon } from './Icon'

const categoryName = (job: Job) => typeof job.categoryId === 'object' ? job.categoryId.name : job.category?.name || 'General work'
const fallbackImages = ['/app-assets/home1.png', '/app-assets/home2.png', '/app-assets/home3.png']

export function statusLabel(status?: string) {
  const labels: Record<string, string> = { in_progress: 'In progress', active: 'Ongoing', started: 'Started', lost: 'Not selected' }
  return labels[status || 'pending'] || (status || 'pending').replaceAll('_', ' ')
}

export function jobImage(job: Job) {
  const source = job.media?.[0]
  if (source?.startsWith('http') || source?.startsWith('data:')) return source
  if (source) {
    const origin = new URL(apiBase).origin
    return `${origin}${source.startsWith('/') ? '' : '/'}${source}`
  }
  const index = Array.from(job._id || job.title).reduce((total, char) => total + char.charCodeAt(0), 0) % fallbackImages.length
  return fallbackImages[index]
}

export function JobCard({ job, compact = false, applicationStatus, progressAware = false }: { job: Job; compact?: boolean; applicationStatus?: string; progressAware?: boolean }) {
  const status = applicationStatus || job.status || 'pending'
  const progressStatuses = ['awarded', 'active', 'started', 'ongoing', 'in_progress', 'completed']
  const destination = progressAware && progressStatuses.includes(status) ? `/jobs/${job._id}/progress` : `/jobs/${job._id}`
  return <Link to={destination} className={`app-job-card ${compact ? 'compact' : ''}`}>
    <div className="app-job-image"><img src={jobImage(job)} alt="" /><span className={`status status-${status}`}>{statusLabel(status)}</span></div>
    <div className="app-job-card-body">
      <small className="job-category">{categoryName(job)}</small>
      <h3>{job.title}</h3>
      <p>{job.description || 'A local service request is waiting for the right professional.'}</p>
      <div className="job-budget-row"><strong>{job.budget ? `£${job.budget}` : 'Quote requested'}</strong><span><Icon name="star" size={14}/> 4.8</span></div>
      <div className="job-location-row"><span><Icon name="map" size={14}/>{job.locationText || 'Location to be agreed'}</span>{job.distanceKm !== undefined && <span>{job.distanceKm.toFixed(1)} km</span>}</div>
    </div>
  </Link>
}

export function MyJobCard({ job, applicationStatus }: { job: Job; applicationStatus?: string }) {
  const status = applicationStatus || job.status || 'pending'
  const progressStatuses = ['awarded', 'active', 'started', 'ongoing', 'in_progress', 'completed']
  const destination = progressStatuses.includes(status) || progressStatuses.includes(job.status || '') ? `/jobs/${job._id}/progress` : `/jobs/${job._id}`
  return <article className="my-job-card">
    <Link to={destination} className="my-job-card-main">
      <img src={jobImage(job)} alt="" />
      <div className="my-job-card-copy">
        <div className="my-job-card-heading"><h3>{job.title}</h3><span className={`status status-${status}`}>{statusLabel(status)}</span></div>
        <small className="job-category">{categoryName(job)}</small>
        <div className="my-job-facts">
          <span><Icon name="calendar" size={15}/>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently posted'}</span>
          <span><Icon name="map" size={15}/>{job.locationText || 'Location to be agreed'}</span>
          <strong>{job.budget ? `£${job.budget}` : 'Quote requested'}</strong>
        </div>
      </div>
    </Link>
    <div className="my-job-actions"><Link to="/chat"><Icon name="message" size={15}/> Messages</Link><Link to={destination}>{destination.endsWith('/progress') ? 'Track progress' : 'View details'} <Icon name="arrow" size={15}/></Link></div>
  </article>
}
