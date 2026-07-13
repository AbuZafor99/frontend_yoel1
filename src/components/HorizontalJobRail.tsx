import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

export function HorizontalJobRail({ children, label = 'Jobs' }: { children: ReactNode; label?: string }) {
  const rail = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const updateEdges = useCallback(() => {
    const element = rail.current
    if (!element) return
    setEdges({ start: element.scrollLeft <= 3, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 3 })
  }, [])

  useEffect(() => {
    updateEdges()
    const element = rail.current
    if (!element) return
    const observer = new ResizeObserver(updateEdges)
    observer.observe(element)
    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const atStart = element.scrollLeft <= 3
      const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 3
      const canMove = event.deltaY > 0 ? !atEnd : !atStart
      if (!canMove) return
      event.preventDefault()
      element.scrollBy({ left: event.deltaY * 1.15, behavior: 'smooth' })
    }
    element.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      observer.disconnect()
      element.removeEventListener('wheel', handleWheel)
    }
  }, [children, updateEdges])

  const scroll = (direction: -1 | 1) => rail.current?.scrollBy({ left: direction * Math.max(260, rail.current.clientWidth * .72), behavior: 'smooth' })

  return <div className="horizontal-rail-shell">
    <button className="rail-control previous" disabled={edges.start} onClick={() => scroll(-1)} aria-label={`Scroll ${label} left`}>‹</button>
    <div className="jobs-horizontal-rail" ref={rail} onScroll={updateEdges} tabIndex={0} aria-label={`${label}. Swipe or scroll horizontally.`}>{children}</div>
    <button className="rail-control next" disabled={edges.end} onClick={() => scroll(1)} aria-label={`Scroll ${label} right`}>›</button>
  </div>
}
