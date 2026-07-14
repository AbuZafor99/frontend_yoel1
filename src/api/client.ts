import type { Application, CarouselItem, Category, ContactStatus, Conversation, Job, Message, Notification, PaymentIntent, Review, User } from '../types'
import { showSnackbar } from '../components/FeedbackHost'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://api.zentrofix.com/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 500) { super(message); this.status = status }
}

type ApiResponse<T> = { success?: boolean; message?: string; data: T; meta?: Record<string, unknown> }
type RequestOptions = RequestInit & { suppressErrorSnackbar?: boolean }

const REQUEST_TIMEOUT_MS = 25000

// Friendly fallbacks for responses where the backend sends no usable message.
const statusFallback = (status: number) => {
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return 'You don’t have permission to do that.'
  if (status === 404) return 'We couldn’t find what you were looking for.'
  if (status === 429) return 'Too many requests right now. Please wait a moment and try again.'
  if (status >= 500) return 'Zentrofix is having a moment. Please try again shortly.'
  return 'The request could not be completed. Please try again.'
}

async function request<T>(path: string, init: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { suppressErrorSnackbar = false, ...fetchInit } = init
  const token = localStorage.getItem('zentrofix_access_token')
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const message = 'You appear to be offline. Check your connection and try again.'
    if (!suppressErrorSnackbar) showSnackbar(message)
    throw new ApiError(message, 0)
  }
  const headers = new Headers(fetchInit.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (fetchInit.body && !(fetchInit.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const timeout = new AbortController()
  const timer = window.setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...fetchInit, headers, credentials: 'include', signal: fetchInit.signal || timeout.signal })
  } catch (caught) {
    const message = timeout.signal.aborted
      ? 'The request is taking longer than expected. Please try again.'
      : caught instanceof Error && caught.name !== 'TypeError' && caught.message !== 'Failed to fetch'
        ? caught.message
        : 'Could not connect to Zentrofix. Check your connection and try again.'
    if (!suppressErrorSnackbar) showSnackbar(message)
    throw new ApiError(message, 0)
  } finally {
    window.clearTimeout(timer)
  }
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.success === false) {
    // A 401 while holding a token means the session is no longer valid —
    // announce it so AuthContext can sign out and route to the login screen,
    // and skip the raw error snackbar since the redirect explains it.
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event('zentrofix:session-expired'))
      throw new ApiError(statusFallback(401), 401)
    }
    const message = payload.message || statusFallback(response.status)
    if (!suppressErrorSnackbar) showSnackbar(message)
    throw new ApiError(message, response.status)
  }
  return payload
}

const json = (value: unknown): RequestInit => ({ body: JSON.stringify(value) })
const data = <T>(response: ApiResponse<T>) => response.data

export const api = {
  login: async (email: string, password: string) => data(await request<{ accessToken: string; refreshToken?: string; role: string; user: User }>('/auth/login', { method: 'POST', ...json({ email, password }) })),
  googleLogin: async (idToken: string, role: 'user' | 'tradesperson') => data(await request<{ accessToken: string; refreshToken?: string; role: string; user: User }>('/auth/google', { method: 'POST', ...json({ idToken, role }) })),
  register: async (body: Record<string, unknown>) => data(await request<{ email: string; role: string }>('/auth/register', { method: 'POST', ...json(body) })),
  verifyOtp: async (email: string, otp: string) => data(await request<unknown>('/auth/verify', { method: 'POST', ...json({ email, otp }) })),
  resendOtp: async (email: string) => data(await request<unknown>('/auth/resend-otp', { method: 'POST', ...json({ email }) })),
  forgotPassword: async (email: string) => data(await request<unknown>('/auth/forget', { method: 'POST', ...json({ email }) })),
  resetPassword: async (body: Record<string, unknown>) => data(await request<unknown>('/auth/reset-password', { method: 'POST', ...json(body) })),
  profile: async (silent = false) => {
    const response = await request<User | { u?: User }>('/users', { suppressErrorSnackbar: silent })
    return (response.data as { u?: User }).u || response.data as User
  },
  updateProfile: async (body: Record<string, unknown>, avatar?: File) => {
    if (!avatar) return data(await request<User>('/users/update-profile', { method: 'PUT', ...json(body) }))
    const form = new FormData(); Object.entries(body).forEach(([key, value]) => value !== undefined && form.append(key, String(value))); form.append('avatar', avatar)
    return data(await request<User>('/users/update-profile', { method: 'PUT', body: form }))
  },
  updateLocation: async (body: { latitude: number; longitude: number; address: string }) => data(await request<User>('/users/location', { method: 'PUT', ...json(body) })),
  categories: async () => data(await request<Category[]>('/categories')),
  carousels: async (silent = false) => data(await request<{ items: CarouselItem[]; count?: number }>('/carousels', { suppressErrorSnackbar: silent })),
  publicJobs: async (query = '', silent = false) => data(await request<Job[]>(`/jobs/public${query}`, { suppressErrorSnackbar: silent })),
  nearJobs: async (query = '') => data(await request<Job[]>(`/jobs/near-you${query}`)),
  myJobs: async () => data(await request<Job[]>('/jobs/me/user')),
  currentJobs: async () => data(await request<Application[]>('/jobs/current-jobs')),
  applications: async (status = '') => data(await request<Application[]>(`/applications/me${status ? `?status=${status}` : ''}`)),
  job: async (id: string) => data(await request<Job>(`/jobs/${id}`)),
  applicants: async (id: string) => data(await request<Application[]>(`/jobs/${id}/applicants`)),
  contactStatus: async (jobId: string, tradespersonId?: string) => data(await request<ContactStatus>(`/jobs/${jobId}/contact-status${tradespersonId ? `?tradespersonId=${encodeURIComponent(tradespersonId)}` : ''}`)),
  createJob: async (body: Record<string, string | number | undefined>, files: File[] = []) => {
    const form = new FormData(); Object.entries(body).forEach(([key, value]) => value !== undefined && form.append(key, String(value))); files.forEach(file => form.append('files', file));
    return data(await request<Job>('/jobs', { method: 'POST', body: form }))
  },
  apply: async (jobId: string, body: Record<string, string | number | undefined>, files: File[] = []) => {
    const form = new FormData(); Object.entries(body).forEach(([key, value]) => value !== undefined && form.append(key, String(value))); files.forEach(file => form.append('files', file));
    return data(await request<Application>(`/applications/jobs/${jobId}/apply`, { method: 'POST', body: form }))
  },
  decideApplication: async (id: string, action: 'accept' | 'decline') => data(await request<Application | { application: Application; job: Job }>(`/applications/${id}/decision`, { method: 'PATCH', ...json({ action }) })),
  updateProgress: async (id: string, progressStage: number) => data(await request<Job>(`/jobs/${id}/progress`, { method: 'PATCH', ...json({ progressStage }) })),
  updateJobStatus: async (id: string, status: string) => data(await request<Job>(`/jobs/${id}/status`, { method: 'PATCH', ...json({ status }) })),
  initiatePayment: async (jobId: string) => data(await request<PaymentIntent>('/payments/initiate', { method: 'POST', ...json({ jobId }) })),
  confirmPayment: async (paymentIntentId: string) => data(await request<{ payment: unknown; job: Job }>('/payments/confirm', { method: 'POST', ...json({ paymentIntentId }) })),
  conversations: async (silent = false) => data(await request<Conversation[]>('/conversations/me', { suppressErrorSnackbar: silent })),
  messages: async (id: string) => data(await request<Message[]>(`/messages/${id}`)),
  sendMessage: async (id: string, text: string) => data(await request<Message>(`/messages/${id}`, { method: 'POST', ...json({ text }) })),
  createConversation: async (otherUserId: string, jobId?: string) => data(await request<Conversation>('/conversations', { method: 'POST', ...json({ otherUserId, jobId }) })),
  notifications: async () => data(await request<Notification[]>('/notifications')),
  markAllRead: async () => data(await request<unknown>('/notifications/read-all', { method: 'PATCH' })),
  reviews: async (jobId: string, stars: number, text: string) => data(await request<unknown>(`/reviews/jobs/${jobId}`, { method: 'POST', ...json({ stars, text }) })),
  jobReviews: async (jobId: string) => data(await request<Review[]>(`/reviews?jobId=${jobId}`)),
}

export const apiBase = API_BASE
