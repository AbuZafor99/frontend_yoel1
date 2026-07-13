import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { AppLoader } from './AppLoader'
import { showSnackbar } from './FeedbackHost'

export type PickedLocation = { address: string; latitude: number; longitude: number }
type SearchResult = { place_id: number; display_name: string; lat: string; lon: string }
type LeafletPoint = { lat: number; lng: number }
type LeafletMap = {
  setView: (point: [number, number], zoom: number, options?: { animate?: boolean }) => LeafletMap
  getCenter: () => LeafletPoint
  on: (event: string, callback: () => void) => LeafletMap
  invalidateSize: (animate?: boolean) => LeafletMap
  remove: () => void
}
type LeafletApi = {
  map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMap
  tileLayer: (url: string, options?: Record<string, unknown>) => { addTo: (map: LeafletMap) => void }
}

declare global { interface Window { L?: LeafletApi } }

const defaultCenter = { latitude: 23.8103, longitude: 90.4125 }
let leafletPromise: Promise<LeafletApi> | null = null

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L)
  if (leafletPromise) return leafletPromise
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-styles')) {
      const styles = document.createElement('link')
      styles.id = 'leaflet-styles'
      styles.rel = 'stylesheet'
      styles.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(styles)
    }
    const existing = document.getElementById('leaflet-script') as HTMLScriptElement | null
    const ready = () => window.L ? resolve(window.L) : reject(new Error('The interactive map could not be loaded.'))
    if (existing) {
      existing.addEventListener('load', ready, { once: true })
      existing.addEventListener('error', () => reject(new Error('The interactive map could not be loaded.')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = 'leaflet-script'
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = ready
    script.onerror = () => reject(new Error('The interactive map could not be loaded.'))
    document.head.appendChild(script)
  })
  return leafletPromise
}

async function reverseGeocode(latitude: number, longitude: number) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Could not identify this address.')
  const result = await response.json()
  return result.display_name as string | undefined
}

export function LocationPickerModal({ initialAddress = '', initialLatitude, initialLongitude, onClose, onSelect }: { initialAddress?: string; initialLatitude?: number; initialLongitude?: number; onClose: () => void; onSelect: (location: PickedLocation) => void }) {
  const mapElement = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletMap | null>(null)
  const [center, setCenter] = useState({ latitude: initialLatitude ?? defaultCenter.latitude, longitude: initialLongitude ?? defaultCenter.longitude })
  const [query, setQuery] = useState(initialAddress)
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [mapLoading, setMapLoading] = useState(true)
  const [mapFallback, setMapFallback] = useState(false)

  const moveMap = useCallback((latitude: number, longitude: number, zoom = 15) => {
    setCenter({ latitude, longitude })
    map.current?.setView([latitude, longitude], zoom, { animate: true })
  }, [])

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return showSnackbar('Location is not supported by this browser.')
    setMapLoading(true)
    navigator.geolocation.getCurrentPosition(
      position => { moveMap(position.coords.latitude, position.coords.longitude); setMapLoading(false); showSnackbar('Map moved to your current location.', 'info') },
      () => { setMapLoading(false); showSnackbar('Location permission was not available. Search for a town or postcode instead.') },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }, [moveMap])

  useEffect(() => {
    let active = true
    loadLeaflet().then(leaflet => {
      if (!active || !mapElement.current) return
      const nextMap = leaflet.map(mapElement.current, { zoomControl: true, attributionControl: true }).setView([center.latitude, center.longitude], initialLatitude !== undefined ? 15 : 13)
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(nextMap)
      nextMap.on('move', () => {
        const point = nextMap.getCenter()
        setCenter({ latitude: point.lat, longitude: point.lng })
      })
      map.current = nextMap
      setMapLoading(false)
      // Leaflet measures the container on creation. This picker mounts during a
      // route transition, so the container often isn't at full height yet and
      // the map renders tiles for only a small area (grey gaps around it).
      // Re-measure on the next frame and again after the transition settles.
      requestAnimationFrame(() => nextMap.invalidateSize())
      window.setTimeout(() => nextMap.invalidateSize(), 350)
      if (initialLatitude === undefined || initialLongitude === undefined) useCurrentLocation()
    }).catch(() => {
      if (!active) return
      setMapFallback(true)
      setMapLoading(false)
      showSnackbar('Interactive map controls could not load. Search and current-location selection are still available.', 'info')
    })
    return () => { active = false; map.current?.remove(); map.current = null }
    // The map is intentionally created only once for this picker instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  const search = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query.trim())}`, { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error('Location search is unavailable right now.')
      const items = await response.json() as SearchResult[]
      setResults(items)
      if (!items.length) showSnackbar('No matching location was found.', 'info')
    } catch (caught) {
      showSnackbar(caught instanceof Error ? caught.message : 'Could not search for that location.')
    } finally {
      setSearching(false)
    }
  }

  const chooseResult = (result: SearchResult) => {
    const latitude = Number(result.lat)
    const longitude = Number(result.lon)
    setQuery(result.display_name)
    setResults([])
    moveMap(latitude, longitude)
  }

  const select = async () => {
    setSelecting(true)
    try {
      const address = await reverseGeocode(center.latitude, center.longitude).catch(() => query.trim() || `${center.latitude.toFixed(6)}, ${center.longitude.toFixed(6)}`)
      onSelect({ address: address || query.trim() || 'Selected location', latitude: center.latitude, longitude: center.longitude })
    } finally {
      setSelecting(false)
    }
  }

  const fallbackMap = `https://www.google.com/maps?q=${center.latitude},${center.longitude}&z=14&output=embed`

  return <div className="location-picker-screen" role="dialog" aria-modal="true" aria-label="Pick location">
    <header><button onClick={onClose} aria-label="Close location picker">←</button><div><span>Job location</span><h2>Pick Location</h2></div><i /></header>
    <div className="location-picker-body">
      <div ref={mapElement} className={`location-picker-map ${mapFallback ? 'hidden' : ''}`} />
      {mapFallback && <iframe className="location-picker-fallback" title="Selected location map" src={fallbackMap} referrerPolicy="no-referrer-when-downgrade" />}
      <div className="location-center-pin"><span><Icon name="map" size={25}/></span><i /></div>
      <form className="location-search-card" onSubmit={search}>
        <Icon name="search" size={20}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search location, town or postcode"/><button disabled={searching}>{searching ? <span className="button-spinner dark"/> : 'Search'}</button>
        {results.length > 0 && <div className="location-search-results">{results.map(result => <button type="button" key={result.place_id} onClick={() => chooseResult(result)}><Icon name="map" size={17}/><span>{result.display_name}</span></button>)}</div>}
      </form>
      <button className="current-location-control" onClick={useCurrentLocation} aria-label="Use current location"><Icon name="target" size={20}/></button>
      <div className="selected-coordinate-chip"><Icon name="map" size={15}/><span>{query || 'Move the map to position the pin'}</span></div>
      {(mapLoading || selecting) && <div className="location-map-loading"><AppLoader label={selecting ? 'Confirming address…' : 'Finding your location…'} compact /></div>}
      <div className="location-picker-action"><button className="button button-primary" disabled={selecting} onClick={select}><Icon name="check" size={17}/> Select This Location</button></div>
    </div>
  </div>
}
