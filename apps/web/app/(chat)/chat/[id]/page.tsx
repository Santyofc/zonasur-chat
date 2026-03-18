import { ConversationList } from '../../../../components/chat/ConversationList'
import { ChatWindow } from '../../../../components/chat/ChatWindow'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChatConversationPage({ params }: Props) {
  const { id } = await params
  return (
    <>
      <ConversationList activeId={id} />
      <ChatWindow conversationId={id} />
    </>
  )
}
