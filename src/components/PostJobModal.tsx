import { useState } from 'react'
import { api } from '../api/client'
import type { Category, Job } from '../types'
import { Modal } from './Modal'
import { showSnackbar } from './FeedbackHost'
import { LocationPickerModal } from './LocationPickerModal'
import { Icon } from './Icon'

export function PostJobModal({ categories, onClose, onSaved }: { categories: Category[]; onClose: () => void; onSaved: (job: Job) => void }) {
  const [body, setBody] = useState({ title: '', description: '', budget: '', locationText: '', categoryId: '', lat: '', lng: '' })
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const update = (key: keyof typeof body) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setBody(current => ({ ...current, [key]: event.target.value }))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!body.locationText || !body.lat || !body.lng) {
      showSnackbar('Select the job location from the map before posting.')
      setShowLocationPicker(true)
      return
    }
    setBusy(true)
    try {
      const job = await api.createJob({ ...body, budget: body.budget ? Number(body.budget) : undefined }, files)
      onSaved(job)
    } catch {
      // The API client presents the failure in the global snackbar.
    } finally {
      setBusy(false)
    }
  }

  return <><Modal title="Post a new job" onClose={onClose}>
    <p className="muted">Add the same details you would in the app. Photos help tradespeople understand the work before quoting.</p>
    <form className="form-grid" onSubmit={submit}>
      <label>Job title<input required value={body.title} onChange={update('title')} placeholder="e.g. Repair a leaking tap" /></label>
      <label>Category<select value={body.categoryId} onChange={update('categoryId')}><option value="">Choose a category</option>{categories.map(category => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label>
      <label className="span-2">Description<textarea required value={body.description} onChange={update('description')} placeholder="What should a tradesperson know?" /></label>
      <label>Budget<input type="number" min="0" value={body.budget} onChange={update('budget')} placeholder="Optional" /></label>
      <label>Location<button type="button" className={`map-location-field ${body.locationText ? 'selected' : ''}`} onClick={() => setShowLocationPicker(true)}><Icon name="map" size={18}/><span>{body.locationText || 'Choose location on map'}</span><Icon name="arrow" size={16}/></button></label>
      <label className="span-2">Job photos<input type="file" accept="image/*" multiple onChange={event => setFiles(Array.from(event.target.files || []))} /></label>
      <div className="location-note span-2"><span>{body.lat ? '✓ Exact map location added for local matching' : 'Tap the location field to open the map picker'}</span><button type="button" className="button button-ghost small-button" onClick={() => setShowLocationPicker(true)}>{body.lat ? 'Change on map' : 'Open map'}</button></div>
      <button className="button button-primary span-2" disabled={busy}>{busy ? <><span className="button-spinner"/> Posting…</> : 'Post job'}</button>
    </form>
  </Modal>{showLocationPicker && <LocationPickerModal initialAddress={body.locationText} initialLatitude={body.lat ? Number(body.lat) : undefined} initialLongitude={body.lng ? Number(body.lng) : undefined} onClose={() => setShowLocationPicker(false)} onSelect={location => { setBody(current => ({ ...current, locationText: location.address, lat: String(location.latitude), lng: String(location.longitude) })); setShowLocationPicker(false); showSnackbar('Job location selected.', 'success') }}/>}</>
}
