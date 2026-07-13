import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { isHomeowner, useAuth } from '../context/AuthContext'
import type { Application, Category, Job } from '../types'
import { JobCard, MyJobCard } from '../components/JobCard'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { AppLoader } from '../components/AppLoader'

type ListedJob = { job: Job; applicationStatus?: string }

export function JobsPage() {
  const { user } = useAuth()
  const homeowner = isHomeowner(user?.role)
  const [params] = useSearchParams()
  const pageView = params.get('view') === 'my' ? 'my' : 'discover'
  const [listed, setListed] = useState<ListedJob[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    setTab('all')
    const load = async () => {
      try {
        const nextCategories = await api.categories()
        setCategories(nextCategories)
        if (pageView === 'my' && homeowner) {
          setListed((await api.myJobs()).map(job => ({ job })))
        } else if (pageView === 'my') {
          const applications: Application[] = await api.applications()
          setListed(applications.flatMap(application => application.jobId && typeof application.jobId === 'object' ? [{ job: application.jobId, applicationStatus: application.status }] : []))
        } else {
          // The mobile app intentionally searches a homeowner's own posted jobs.
          // The deployed API currently routes `/jobs/public` through `/:jobId`,
          // which casts "public" as an ObjectId and returns "Invalid ID".
          const jobs = homeowner ? await api.myJobs() : await api.nearJobs('?page=1&limit=40')
          setListed(jobs.map(job => ({ job })))
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not load jobs')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [homeowner, pageView])

  const tabs = pageView === 'discover' ? [['all', 'All Jobs'], ['pending', 'Open Jobs']] : homeowner
    ? [['all', 'All Jobs'], ['pending', 'Pending'], ['active', 'Ongoing'], ['in_progress', 'In Progress'], ['completed', 'Completed'], ['cancelled', 'Cancelled']]
    : [['all', 'All Jobs'], ['pending', 'Applied'], ['active', 'Ongoing'], ['completed', 'Completed'], ['lost', 'Not Selected']]

  const visible = useMemo(() => listed.filter(({ job, applicationStatus }) => {
    const category = job.categoryId && typeof job.categoryId === 'object' ? job.categoryId.name : job.category?.name || ''
    const matchesQuery = `${job.title} ${job.description || ''} ${job.locationText || ''} ${category}`.toLowerCase().includes(query.toLowerCase())
    const status = applicationStatus || job.status || 'pending'
    return matchesQuery && (tab === 'all' || status === tab || (tab === 'active' && ['started', 'ongoing'].includes(status)))
  }), [listed, query, tab])

  return <>
    <div className="app-screen-heading">
      <div><span>{pageView === 'my' ? 'Your work' : 'Search and discover'}</span><h1>{pageView === 'my' ? 'My Jobs' : homeowner ? 'Discover' : 'Jobs Near You'}</h1><p>{pageView === 'my' ? 'Follow every job from the first response through completion.' : homeowner ? 'Quickly search and find the jobs you have posted.' : 'Browse image-led job posts using the same information shown in the app.'}</p></div>
      {homeowner && <Link className="button button-primary" to="/jobs/new"><Icon name="plus" size={17}/> Post a job</Link>}
    </div>

    <div className="app-jobs-toolbar">
      <label className="app-search"><Icon name="search" size={19}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search jobs, locations or categories" /></label>
      <button className="app-filter-button" aria-label="Filter jobs"><Icon name="filter" size={19}/></button>
    </div>
    <div className="app-segment-tabs">{tabs.map(([value, label]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{label}</button>)}</div>
    {pageView === 'discover' && <div className="app-category-chips">{categories.slice(0, 8).map(category => <button key={category._id} onClick={() => setQuery(category.name)}>{category.name}</button>)}</div>}

    {loading ? <AppLoader label="Loading jobs…" /> : visible.length ? pageView === 'my'
      ? <div className="my-jobs-list">{visible.map(({ job, applicationStatus }) => <MyJobCard key={`${job._id}-${applicationStatus || ''}`} job={job} applicationStatus={applicationStatus} />)}</div>
      : <div className="discover-job-grid">{visible.map(({ job }) => <JobCard key={job._id} job={job} progressAware={homeowner} />)}</div>
      : <EmptyState icon="▣" title={error ? 'Jobs could not be loaded' : 'No matching jobs'} text={error ? 'Please try again in a moment.' : 'Try a different filter or search phrase.'} action={<button className="button button-ghost" onClick={() => { setQuery(''); setTab('all') }}>Clear filters</button>} />}
  </>
}
