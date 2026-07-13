export type Role = 'homeowner' | 'user' | 'tradesperson' | 'admin'

export type User = {
  _id: string
  name?: string
  email: string
  role: Role
  phone?: string
  address?: string
  bio?: string
  profileImage?: { url?: string }
  isKycVerified?: boolean
  accountStatus?: string
  ratingSummary?: { avg?: number; count?: number }
  serviceArea?: string
  operatingTrades?: Array<{ _id: string; name: string } | string>
  userLocation?: { type?: 'Point'; coordinates?: number[] }
}

export type Job = {
  _id: string
  title: string
  description?: string
  budget?: number
  locationText?: string
  status?: string
  progressStage?: number
  paymentStatus?: string
  createdAt?: string
  startedAt?: string
  completedAt?: string
  media?: string[]
  finishedWorkPhotos?: string[]
  distanceKm?: number
  locationGeo?: { type?: 'Point'; coordinates?: number[] }
  categoryId?: { _id?: string; name?: string } | string
  category?: { _id?: string; name?: string }
  userId?: User | string
  tradePerson?: User | string
}

export type ContactStatus = {
  jobId: string
  isAwarded: boolean
  isPaid: boolean
  canViewContact: boolean
  contact: null | {
    _id: string
    name?: string
    profileImage?: { url?: string }
    phone?: string
    email?: string
  }
}

export type PaymentIntent = {
  clientSecret: string
  paymentIntentId: string
  amount: number
  currency: string
}

export type Application = {
  _id: string
  status: string
  price?: number
  estimatedStartDate?: string
  additionalInfo?: string
  jobId?: Job | string
  tradespersonId?: User | string
}

export type Review = {
  _id: string
  jobId: string
  userId: string
  tradespersonId: string
  revieweeId: string
  reviewerRole: 'user' | 'tradesperson'
  stars: number
  text?: string
  createdAt?: string
}

export type Category = { _id: string; name: string; image?: string }
export type CarouselItem = {
  _id: string
  type?: 'ad' | 'coupon'
  title: string
  subtitle?: string
  image?: { url?: string }
  link?: string
  discountPercentage?: number | null
}
export type Conversation = {
  _id: string
  participants?: User[]
  lastMessageText?: string
  lastMessageAt?: string
  jobId?: string
}
export type Message = { _id: string; text: string; senderId: string; createdAt?: string }
export type Notification = {
  _id: string
  title: string
  message: string
  isRead?: boolean
  createdAt?: string
  type?: string
}
