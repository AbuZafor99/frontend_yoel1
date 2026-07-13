import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Notification } from '../types'
import { EmptyState } from '../components/EmptyState'
import { AppLoader } from '../components/AppLoader'
import { showSnackbar } from '../components/FeedbackHost'

export function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => { api.notifications().then(setItems).catch(() => undefined).finally(() => setLoading(false)) }, [])

  const markAll = async () => {
    setUpdating(true)
    try {
      await api.markAllRead()
      setItems(current => current.map(item => ({ ...item, isRead: true })))
      showSnackbar('All notifications marked as read.', 'success')
    } catch {
      // The API client presents the failure in the global snackbar.
    } finally {
      setUpdating(false)
    }
  }

  return <>
    <div className="page-heading"><div><span className="eyebrow">Keep up to date</span><h1>Notifications</h1><p>Updates about your jobs, applications and messages.</p></div><button className="button button-ghost" onClick={markAll} disabled={updating}>{updating ? <><span className="button-spinner dark"/> Updating…</> : 'Mark all read'}</button></div>
    {loading ? <AppLoader label="Loading notifications…" /> : items.length ? <div className="notification-list">{items.map(item => <div className={item.isRead ? 'notification read' : 'notification'} key={item._id}><span className="notification-dot">{item.type === 'message' ? '◌' : '✦'}</span><div><strong>{item.title}</strong><p>{item.message}</p><small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recently'}</small></div></div>)}</div> : <EmptyState icon="♧" title="You’re all caught up" text="New job and message updates will show here." />}
  </>
}
