// ─────────────────────────────────────────────────────────────
// @zs/types — shared TypeScript interfaces for zonasur-chat
// Used by both apps/web and apps/api
// ─────────────────────────────────────────────────────────────

// ─── User ─────────────────────────────────────────────────────

export interface User {
  id: string
  auth_id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  phone: string | null
  status: UserStatus
  last_seen_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type UserStatus = 'online' | 'offline' | 'away' | 'busy'

export interface UserProfile {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  status: UserStatus
  last_seen_at: string | null
}

// ─── Contact ──────────────────────────────────────────────────

export type ContactStatus = 'pending' | 'accepted' | 'blocked'

export interface Contact {
  id: string
  user_id: string
  contact_user_id: string
  status: ContactStatus
  created_at: string
  updated_at: string
  /** Populated on join */
  contact?: UserProfile
}

// ─── Conversation ─────────────────────────────────────────────

export type ConversationType = 'direct' | 'group'

export interface Conversation {
  id: string
  type: ConversationType
  name: string | null
  description: string | null
  avatar_url: string | null
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  /** Populated on join */
  members?: ConversationMember[]
  last_message?: Message | null
  unread_count?: number
}

export interface ConversationMember {
  id: string
  conversation_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  last_read_at: string | null
  /** Populated on join */
  user?: UserProfile
}

// ─── Message ──────────────────────────────────────────────────

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'system'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  type: MessageType
  content: string
  reply_to_id: string | null
  edited_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  /** Populated on join */
  sender?: UserProfile
  attachments?: Attachment[]
  receipts?: MessageReceipt[]
}

export interface Attachment {
  id: string
  message_id: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  created_at: string
}

export type ReceiptStatus = 'sent' | 'delivered' | 'read'

export interface MessageReceipt {
  id: string
  message_id: string
  user_id: string
  status: ReceiptStatus
  updated_at: string
}

// ─── Socket.IO Event Payloads ─────────────────────────────────

/** client → server */
export interface SendMessagePayload {
  conversation_id: string
  content: string
  type?: MessageType
  reply_to_id?: string
  temp_id?: string /** client-generated temp ID for optimistic UI */
}

export interface ReadMessagePayload {
  message_id: string
  conversation_id: string
}

export interface TypingPayload {
  conversation_id: string
}

export interface PresencePingPayload {
  status?: UserStatus
}

/** server → client */
export interface NewMessageEvent {
  message: Message
  temp_id?: string
}

export interface MessageDeliveredEvent {
  message_id: string
  conversation_id: string
  user_id: string
}

export interface MessageReadEvent {
  message_id: string
  conversation_id: string
  user_id: string
}

export interface TypingUpdateEvent {
  conversation_id: string
  user_id: string
  display_name: string
  is_typing: boolean
}

export interface PresenceUpdateEvent {
  user_id: string
  status: UserStatus
  last_seen_at: string
}

// ─── API Response Wrappers ────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ApiError {
  statusCode: number
  message: string
  error?: string
}
