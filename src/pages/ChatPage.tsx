import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Conversation, Message, User } from '../types'
import { EmptyState } from '../components/EmptyState'
import { AppLoader } from '../components/AppLoader'

export function ChatPage() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const requestedConversation = params.get('conversation') || ''
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    api.conversations().then(items => {
      setConversations(items)
      const requested = items.find(item => item._id === requestedConversation)
      setSelected(requested?._id || items[0]?._id || '')
    }).catch(() => undefined).finally(() => setLoadingConversations(false))
  }, [requestedConversation])

  useEffect(() => {
    if (!selected) return
    setLoadingMessages(true)
    api.messages(selected).then(setMessages).catch(() => undefined).finally(() => setLoadingMessages(false))
  }, [selected])

  const current = conversations.find(conversation => conversation._id === selected)
  const other = current?.participants?.find(person => person._id !== user?._id) as User | undefined

  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    const messageText = text.trim()
    if (!messageText || !selected || sending) return
    setSending(true)
    try {
      const next = await api.sendMessage(selected, messageText)
      setMessages(currentMessages => [...currentMessages, next])
      setText('')
    } catch {
      // The API client presents the failure in the global snackbar.
    } finally {
      setSending(false)
    }
  }

  return <>
    <div className="page-heading"><div><span className="eyebrow">Stay in touch</span><h1>Messages</h1><p>Keep every job conversation clear and in one place.</p></div></div>
    <div className="chat-layout">
      <aside className="conversation-list">
        <div className="conversation-heading"><strong>Inbox</strong><span>{conversations.length}</span></div>
        {loadingConversations ? <AppLoader label="Loading conversations…" compact /> : conversations.map(conversation => {
          const person = conversation.participants?.find(item => item._id !== user?._id)
          return <button className={selected === conversation._id ? 'conversation selected' : 'conversation'} onClick={() => setSelected(conversation._id)} key={conversation._id}>
            <span className="avatar avatar-blue">{(person?.name || 'U').slice(0, 1)}</span>
            <span><strong>{person?.name || 'Zentrofix member'}</strong><small>{conversation.lastMessageText || 'Start a conversation'}</small></span>
          </button>
        })}
        {!loadingConversations && !conversations.length && <EmptyState icon="◌" title="No messages yet" text="Messages will appear here when you connect with someone." />}
      </aside>
      <section className="chat-window">
        {current ? <>
          <div className="chat-header"><span className="avatar avatar-purple">{(other?.name || 'U').slice(0, 1)}</span><div><strong>{other?.name || 'Zentrofix member'}</strong><small>Keep communication on Zentrofix</small></div></div>
          <div className="message-list">{loadingMessages ? <AppLoader label="Loading messages…" compact /> : messages.map(message => <div className={message.senderId === user?._id ? 'message mine' : 'message'} key={message._id}><p>{message.text}</p><small>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</small></div>)}</div>
          <form className="message-composer" onSubmit={send}>
            <input value={text} disabled={sending} onChange={event => setText(event.target.value)} placeholder="Write a message…" />
            <button className="button button-primary message-send-button" disabled={sending || !text.trim()}>{sending ? <><span className="button-spinner" /> Sending</> : 'Send'}</button>
          </form>
        </> : <EmptyState icon="◌" title="Select a conversation" text="Choose an inbox thread to read and reply." />}
      </section>
    </div>
  </>
}
