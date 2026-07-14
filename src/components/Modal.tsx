import { useEffect } from 'react'

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    // Lock background scroll while the dialog is open; restore the previous
    // value on close so nested/stacked modals don't clobber each other.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={event => event.stopPropagation()}>
      <div className="modal-header"><h2>{title}</h2><button className="close-button" onClick={onClose} aria-label="Close dialog">×</button></div>
      {children}
    </div>
  </div>
}
