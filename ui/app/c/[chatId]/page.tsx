import ChatWindow from '@/components/ChatWindow';

const Page = async ({ params }: { params: Promise<{ chatId: string }> }) => {
  const resolvedParams = await params; // Resolve the promise
  return <ChatWindow id={resolvedParams.chatId} />;
};

export default Page;
