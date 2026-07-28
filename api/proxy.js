// Same-origin API proxy. The browser calls /api/v1/* on the frontend's own
// domain; the vercel.json rewrite funnels those requests here with the API
// path in ?path=, and this edge function forwards them to the Zentrofix API
// server-to-server. Server-side requests carry no browser Origin header, so
// the API's CORS allowlist (which doesn't include this Vercel domain) accepts
// them — no backend change needed.
export const config = { runtime: 'edge' }

const API_ORIGIN = 'https://pr7m9mtd-5006.asse.devtunnels.ms'

export default async function handler(request) {
  const url = new URL(request.url)
  const path = url.searchParams.get('path')
  if (!path) {
    return new Response(JSON.stringify({ success: false, message: 'Missing API path.' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }
  // The rewrite merges the browser's own query params (page, limit, …) with
  // ?path=; strip path and forward the rest untouched.
  url.searchParams.delete('path')
  const search = url.searchParams.toString()
  const target = `${API_ORIGIN}/api/v1/${path}${search ? `?${search}` : ''}`

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
