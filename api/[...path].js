// Same-origin API proxy. The browser calls /api/v1/* on the frontend's own
// domain; this edge function forwards the request to the Zentrofix API
// server-to-server. Server-side requests carry no browser Origin header, so
// the API's CORS allowlist (which doesn't include this Vercel domain) accepts
// them — no backend change needed.
export const config = { runtime: 'edge' }

const API_ORIGIN = 'https://api.zentrofix.com'

export default async function handler(request) {
  const url = new URL(request.url)
  const target = `${API_ORIGIN}${url.pathname}${url.search}`

  // Forward only the headers the API needs; dropping Origin/Referer/Host is
  // what lets the request pass the API's CORS check.
  const headers = new Headers()
  for (const name of ['accept', 'authorization', 'content-type']) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }

  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer()

  let upstream
  try {
    upstream = await fetch(target, { method: request.method, headers, body, redirect: 'manual' })
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'Could not reach the Zentrofix API. Please try again.' }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }

  const responseHeaders = new Headers()
  const contentType = upstream.headers.get('content-type')
  if (contentType) responseHeaders.set('content-type', contentType)
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
}
