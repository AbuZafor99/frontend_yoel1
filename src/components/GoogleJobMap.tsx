import type { Job } from '../types'
import { Icon } from './Icon'

export function GoogleJobMap({ job, compact = false }: { job: Job; compact?: boolean }) {
  const coordinates = job.locationGeo?.coordinates || []
  const hasCoordinates = coordinates.length >= 2 && Number.isFinite(Number(coordinates[0])) && Number.isFinite(Number(coordinates[1]))
  const latitude = hasCoordinates ? Number(coordinates[1]) : undefined
  const longitude = hasCoordinates ? Number(coordinates[0]) : undefined
  const query = hasCoordinates ? `${latitude},${longitude}` : job.locationText?.trim()
  if (!query) return null
  const encodedQuery = encodeURIComponent(query)
  const embedUrl = `https://www.google.com/maps?q=${encodedQuery}&z=14&output=embed`
  const externalUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`

  return <section className={compact ? 'job-map-card compact' : 'job-map-card'}>
    <div className="job-map-heading"><span><Icon name="map" size={19}/></span><div><strong>Job location</strong><small>{job.locationText || `${latitude}, ${longitude}`}</small></div><a href={externalUrl} target="_blank" rel="noreferrer">Open in Google Maps <Icon name="arrow" size={14}/></a></div>
    <div className="job-map-frame"><iframe title={`Map for ${job.title}`} src={embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
  </section>
}
