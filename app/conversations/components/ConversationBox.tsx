"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";
import clsx from "clsx";
import Image from "next/image"; 

import { FullConversationType } from "@/types";
import useOtherUser from "@/hooks/useOtherUser";
import Avatar from "@/app/components/Avatar"; // <--- 1. Import vũ khí bí mật

interface ConversationBoxProps {
  data: FullConversationType,
  selected?: boolean;
}

const ConversationBox: React.FC<ConversationBoxProps> = ({ data, selected }) => {
  const otherUser = useOtherUser(data);
  const { user } = useUser();
  const router = useRouter();

  const handleClick = useCallback(() => {
    router.push(`/conversations/${data.id}`);
  }, [data, router]);

  const lastMessage = useMemo(() => {
    const messages = data.messages || [];
    return messages[messages.length - 1];
  }, [data.messages]);

  const hasSeen = useMemo(() => {
    if (!lastMessage) return false;
    if (!user) return false; 
    
    const seenArray = lastMessage.seen || [];
    return seenArray.filter((u) => u.email === user.emailAddresses[0]?.emailAddress).length !== 0;
  }, [user, lastMessage]);

  const lastMessageText = useMemo(() => {
    if (lastMessage?.image) return 'Đã gửi một tệp';
    if (lastMessage?.body) return lastMessage.body;
    return 'Bắt đầu cuộc trò chuyện';
  }, [lastMessage]);

  return ( 
    <div 
      onClick={handleClick}
      className={clsx(`
        w-full relative flex items-center space-x-3 p-3 
        hover:bg-neutral-100 rounded-lg transition cursor-pointer
        mb-2  /* <--- 2. Fix lỗi dính nhau (Thêm khoảng cách dưới) */
        `,
        selected ? 'bg-neutral-100' : 'bg-white'
      )}
    >
      {/* 3. Logic hiển thị Avatar xịn */}
      {data.isGroup ? (
         // Nếu là Group: Dùng ảnh tĩnh (chưa cần check online cả nhóm)
         <div className="relative h-9 w-9 md:h-11 md:w-11">
            <Image 
               fill
               src="/images/group_placeholder.jpg"
               alt="Group Avatar"
               className="rounded-full object-cover"
            />
         </div>
      ) : (
         <Avatar user={otherUser} />
      )}

      <div className="min-w-0 flex-1">
        <div className="focus:outline-none">
          <div className="flex justify-between items-center mb-1">
            <p className="text-md font-medium text-gray-900 truncate">
              {data.name || otherUser?.username}
            </p>
            {lastMessage?.createdAt && (
              <p className="text-xs text-gray-400 font-light">
                {format(new Date(lastMessage.createdAt), 'p')}
              </p>
            )}
          </div>
          <p className={clsx(`
              truncate text-sm
              `,
              hasSeen ? 'text-gray-500' : 'text-black font-bold'
            )}>
              {lastMessageText}
          </p>
        </div>
      </div>
    </div>
  );
}
 
export default ConversationBox;