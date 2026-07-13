import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { isHomeowner, useAuth } from '../context/AuthContext'
import { showSnackbar } from '../components/FeedbackHost'
import { LocationPickerModal, type PickedLocation } from '../components/LocationPickerModal'
import { Icon } from '../components/Icon'

export function ProfilePage() {
  const { user, refresh } = useAuth()
  const [params, setParams] = useSearchParams()
  const [body, setBody] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '', bio: user?.bio || '', serviceArea: user?.serviceArea || '' })
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInput = useRef<HTMLInputElement>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(params.get('pickLocation') === '1')
  const update = (key: keyof typeof body) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setBody(current => ({ ...current, [key]: event.target.value }))

  useEffect(() => { if (params.get('pickLocation') === '1') setShowLocationPicker(true) }, [params])

  const closeLocationPicker = () => {
    setShowLocationPicker(false)
    if (params.has('pickLocation')) { const next = new URLSearchParams(params); next.delete('pickLocation'); setParams(next, { replace: true }) }
  }

  const saveLocation = async (location: PickedLocation) => {
    setSaving(true)
    try {
      await api.updateLocation(location)
      setBody(current => ({ ...current, address: location.address }))
      await refresh()
      closeLocationPicker()
      showSnackbar('Your location was updated.', 'success')
    } catch {
      // The API client presents the failure in the global snackbar.
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return showSnackbar('Please choose an image file.')
    setUploadingAvatar(true)
    try {
      await api.updateProfile(body, file)
      await refresh()
      showSnackbar('Profile photo updated.', 'success')
    } catch {
      // The API client presents the failure in the global snackbar.
    } finally {
      setUploadingAvatar(false)
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await api.updateProfile(body)
      await refresh()
      showSnackbar('Profile saved successfully.', 'success')
    } catch {
      // The API client presents the failure in the global snackbar.
    } finally {
      setSaving(false)
    }
  }

  return <>
    <div className="page-heading"><div><span className="eyebrow">Your account</span><h1>Profile</h1><p>Make it easier for the right people to trust and find you.</p></div></div>
    <div className="profile-layout">
      <aside className="profile-summary">
        <button type="button" className="profile-avatar editable" onClick={() => avatarInput.current?.click()} disabled={uploadingAvatar} aria-label="Change profile photo">
          {user?.profileImage?.url ? <img src={user.profileImage.url} alt="Profile" /> : <span>{(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}</span>}
          <i className="profile-avatar-edit">{uploadingAvatar ? <span className="button-spinner" /> : <Icon name="camera" size={16} />}</i>
        </button>
        <input ref={avatarInput} type="file" accept="image/*" hidden onChange={uploadAvatar} />
        <h2>{user?.name || 'Zentrofix member'}</h2><p>{user?.email}</p><span className="role-chip inline">{isHomeowner(user?.role) ? 'Homeowner' : 'Tradesperson'}</span>{user?.isKycVerified && <span className="verified-label">✓ Identity verified</span>}
      </aside>
      <form className="profile-form panel" onSubmit={submit}><div className="section-heading"><div><h2>Personal information</h2><p className="muted">Your information is only used to support your Zentrofix work.</p></div></div><div className="form-grid"><label>Name<input value={body.name} onChange={update('name')} /></label><label>Phone<input value={body.phone} onChange={update('phone')} /></label><label>Address<button type="button" className={`map-location-field ${body.address ? 'selected' : ''}`} onClick={() => setShowLocationPicker(true)}><Icon name="map" size={18}/><span>{body.address || 'Choose location on map'}</span><Icon name="arrow" size={16}/></button></label>{!isHomeowner(user?.role) && <label>Service area<input value={body.serviceArea} onChange={update('serviceArea')} placeholder="e.g. North London" /></label>}<label className="span-2">Bio<textarea value={body.bio} onChange={update('bio')} placeholder="A little about you and your work" /></label><button className="button button-primary" disabled={saving}>{saving ? <><span className="button-spinner"/> Saving…</> : 'Save changes'}</button></div></form>
    </div>
    {showLocationPicker && <LocationPickerModal initialAddress={body.address} initialLatitude={user?.userLocation?.coordinates?.[1]} initialLongitude={user?.userLocation?.coordinates?.[0]} onClose={closeLocationPicker} onSelect={saveLocation}/>} 
  </>
}
