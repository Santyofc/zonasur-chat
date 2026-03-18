import { ConversationList } from '../../../components/chat/ConversationList'

export default function ChatIndexPage() {
  return (
    <>
      <ConversationList />
      {/* Empty state — select a conversation */}
      <main className="flex-1 flex flex-col items-center justify-center bg-zs-bg-primary">
        <div className="text-center space-y-3 opacity-40">
          <svg className="w-16 h-16 mx-auto text-zs-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-zs-text-secondary text-sm">Seleccioná una conversación</p>
        </div>
      </main>
    </>
  )
}
