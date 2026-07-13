import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { ContactStatus } from '../types'
import { Icon } from './Icon'
import { AppLoader } from './AppLoader'

export function RestrictedContactPanel({ jobId, tradespersonId, fallbackName, profileImage, allowMessage = true }: { jobId: string; tradespersonId?: string; fallbackName?: string; profileImage?: string; allowMessage?: boolean }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<ContactStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const targetId = status?.contact?._id || tradespersonId

  useEffect(() => {
    setLoading(true)
    api.contactStatus(jobId, tradespersonId).then(setStatus).catch(() => undefined).finally(() => setLoading(false))
  }, [jobId, tradespersonId])

  const startMessage = async () => {
    if (!targetId) return
    setLoading(true)
    try {
      const conversation = await api.createConversation(targetId, jobId)
      navigate(`/chat?conversation=${conversation._id}`)
    } catch {
      // The API client presents the failure in the global snackbar.
    } finally {
      setLoading(false)
    }
  }

  const contact = status?.contact
  const image = contact?.profileImage?.url || profileImage
  return <div className="restricted-contact-card">
    <div className="restricted-profile-row">
      <span className="restricted-avatar">{image ? <img src={image} alt=""/> : (contact?.name || fallbackName || 'U').slice(0,1).toUpperCase()}</span>
      <div><span className="eyebrow">User information</span><h3>{contact?.name || fallbackName || 'Zentrofix member'}</h3></div>
      {allowMessage && targetId && <button className="restricted-message-button" disabled={loading} onClick={startMessage}><Icon name="message" size={17}/><span>Message</span></button>}
    </div>
    {loading ? <AppLoader label="Checking contact access…" compact /> : <>
      <div className={status?.canViewContact ? 'contact-access-banner unlocked' : 'contact-access-banner'}><Icon name={status?.canViewContact ? 'check' : 'lock'} size={17}/><span>{status?.canViewContact ? 'Contact details unlocked' : 'Contact details unlock after this user is awarded the job and payment is completed.'}</span></div>
      <div className="restricted-contact-list">
        <div><span><Icon name="mail" size={17}/></span><p><small>Email</small><strong className={status?.canViewContact ? '' : 'masked'}>{contact?.email || 'Unavailable'}</strong></p>{!status?.canViewContact && <Icon name="lock" size={14}/>}</div>
        <div><span><Icon name="phone" size={17}/></span><p><small>Mobile</small><strong className={status?.canViewContact ? '' : 'masked'}>{contact?.phone || 'Unavailable'}</strong></p>{!status?.canViewContact && <Icon name="lock" size={14}/>}</div>
      </div>
    </>}
  </div>
}
