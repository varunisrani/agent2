import { Clock, Edit, Share, Trash, BarChart2, Building } from 'lucide-react';
import { Message } from './ChatWindow';
import { useEffect, useState } from 'react';
import { formatTimeDifference } from '@/lib/utils';
import DeleteChat from './DeleteChat';
import type { LucideIcon } from 'lucide-react';

const IconComponent = ({ icon: Icon, size = 17 }: { icon: LucideIcon; size?: number }) => {
  const IconElement = Icon as React.ElementType;
  return <IconElement size={size} />;
};

const Navbar = ({
  chatId,
  messages,
}: {
  messages: Message[];
  chatId: string;
}) => {
  const [title, setTitle] = useState<string>('');
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (messages.length > 0) {
      const newTitle =
        messages[0].content.length > 20
          ? `${messages[0].content.substring(0, 20).trim()}...`
          : messages[0].content;
      setTitle(newTitle);
      const newTimeAgo = formatTimeDifference(
        new Date(),
        messages[0].createdAt,
      );
      setTimeAgo(newTimeAgo);
    }
  }, [messages]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (messages.length > 0) {
        const newTimeAgo = formatTimeDifference(
          new Date(),
          messages[0].createdAt,
        );
        setTimeAgo(newTimeAgo);
      }
    }, 1000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed z-40 top-0 left-0 right-0 px-4 lg:pl-[104px] lg:pr-6 lg:px-8 flex flex-row items-center justify-between w-full py-4 text-sm text-black dark:text-white/70 border-b bg-light-primary dark:bg-dark-primary border-light-100 dark:border-dark-200">
      <div className="flex flex-row items-center space-x-4">
        <a
          href="/"
          className="active:scale-95 transition duration-100 cursor-pointer lg:hidden"
        >
          <IconComponent icon={Edit} />
        </a>
        <div className="hidden lg:flex flex-row items-center justify-center space-x-2">
          <IconComponent icon={Clock} />
          <p className="text-xs">{timeAgo} ago</p>
        </div>
      </div>

      <p className="hidden lg:flex">{title}</p>

      <div className="flex flex-row items-center space-x-4">
        {/* Pro Mode Button */}
        <a
          href="/pro-mode"
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition cursor-pointer"
        >
          <IconComponent icon={BarChart2} size={16} />
          <span className="text-xs font-medium">Pro Mode</span>
        </a>

        {/* Company Form Button */}
        <a
          href="/company-form"
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition cursor-pointer"
        >
          <IconComponent icon={Building} size={16} />
          <span className="text-xs font-medium">Company</span>
        </a>

        <div className="active:scale-95 transition duration-100 cursor-pointer">
          <IconComponent icon={Share} />
        </div>
        <DeleteChat redirect chatId={chatId} chats={[]} setChats={() => {}} />
      </div>
    </div>
  );
};

export default Navbar;
