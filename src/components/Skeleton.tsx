// Structured shimmer placeholders that mirror the real card layouts, so
// loading screens keep the page's shape instead of collapsing to a spinner.
// Styles live in polish.css (.skeleton-*).

function SkeletonJobCard() {
  return <div className="skeleton-card">
    <div className="skeleton-block skeleton-media" />
    <div className="skeleton-card-body">
      <span className="skeleton-block skeleton-line" style={{ width: '38%' }} />
      <span className="skeleton-block skeleton-line lg" style={{ width: '84%' }} />
      <span className="skeleton-block skeleton-line" style={{ width: '68%' }} />
      <div className="skeleton-foot">
        <span className="skeleton-block skeleton-line lg" style={{ width: '30%' }} />
        <span className="skeleton-block skeleton-line" style={{ width: '18%' }} />
      </div>
    </div>
  </div>
}

function SkeletonRowCard() {
  return <div className="skeleton-card skeleton-row">
    <span className="skeleton-block skeleton-thumb" />
    <div className="skeleton-row-copy">
      <span className="skeleton-block skeleton-line lg" style={{ width: '46%' }} />
      <span className="skeleton-block skeleton-line" style={{ width: '28%' }} />
      <div className="skeleton-foot">
        <span className="skeleton-block skeleton-line" style={{ width: '32%' }} />
        <span className="skeleton-block skeleton-line" style={{ width: '22%' }} />
      </div>
    </div>
  </div>
}

/** Horizontal rail of job-card placeholders (dashboard rails). */
export function SkeletonRail({ count = 4 }: { count?: number }) {
  return <div className="jobs-horizontal-rail skeleton-host" role="status" aria-label="Loading">
    {Array.from({ length: count }, (_, index) => <SkeletonJobCard key={index} />)}
  </div>
}

/** Responsive grid of job-card placeholders (discover view). */
export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return <div className="discover-job-grid skeleton-host" role="status" aria-label="Loading">
    {Array.from({ length: count }, (_, index) => <SkeletonJobCard key={index} />)}
  </div>
}

/** Stacked row placeholders (my jobs, notifications). */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return <div className="my-jobs-list skeleton-host" role="status" aria-label="Loading">
    {Array.from({ length: count }, (_, index) => <SkeletonRowCard key={index} />)}
  </div>
}
