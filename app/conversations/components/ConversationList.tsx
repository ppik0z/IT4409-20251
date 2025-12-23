"use client";

import { FullConversationType } from "@/types"; 
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import useConversation from "@/hooks/useConversation";
import clsx from "clsx";
import ConversationBox from "./ConversationBox";
import { useUser } from "@clerk/nextjs"; 
import { pusherClient } from "@/lib/pusher"; 
import GroupChatModal from "@/app/components/sidebar/GroupChatModal"; 
import { User } from "@prisma/client";

interface ConversationListProps {
  initialItems: FullConversationType[];
  users: User[];
}

const ConversationList: React.FC<ConversationListProps> = ({ initialItems, users }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const router = useRouter();
  const { conversationId, isOpen } = useConversation();
  const { user } = useUser(); 

  const pusherKey = useMemo(() => {
    return user?.emailAddresses[0]?.emailAddress;
  }, [user?.emailAddresses]);

  useEffect(() => {
    if (!pusherKey) {
      return;
    }

    pusherClient.subscribe(pusherKey);

    const updateHandler = (conversation: FullConversationType) => {
      setItems((current) => {
        return current.map((currentConversation) => {
          if (currentConversation.id === conversation.id) {
            return {
              ...currentConversation,
              messages: conversation.messages
            };
          }

          return currentConversation;
        });
      });
    };

    const newHandler = (conversation: FullConversationType) => {
      setItems((current) => {
  
        if (current.find((item) => item.id === conversation.id)) {
          return current;
        }
   
        return [conversation, ...current];
      });
    };

    const removeHandler = (conversation: FullConversationType) => {
        setItems((current) => {
            return [...current.filter((convo) => convo.id !== conversation.id)]
        });
        

        if (conversationId === conversation.id) {
            router.push('/conversations');
        }
    };

    pusherClient.bind('conversation:update', updateHandler);
    pusherClient.bind('conversation:new', newHandler); // Tí làm API tạo chat nhớ thêm cái này
    pusherClient.bind('conversation:remove', removeHandler);

    return () => {
      pusherClient.unsubscribe(pusherKey);
      pusherClient.unbind('conversation:update', updateHandler);
      pusherClient.unbind('conversation:new', newHandler);
      pusherClient.unbind('conversation:remove', removeHandler);
    }
  }, [pusherKey, conversationId, router]);

  return ( 
    <>
      {/* Đặt Modal ở đây */}
      <GroupChatModal 
        users={users} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    

      <aside className={clsx(`
          fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 lg:block overflow-y-auto border-r border-gray-200 
        `,
        isOpen ? 'hidden' : 'block w-full left-0'
      )}>
        <div className="px-5">
          <div className="flex justify-between mb-4 pt-4">
            <div className="text-2xl font-bold text-neutral-800">
              Tin nhắn
            </div>
            <div 
              onClick={() => setIsModalOpen(true)}
              className="rounded-full p-2 bg-gray-100 text-gray-600 cursor-pointer hover:opacity-75 transition"
            >
              +
            </div>
          </div>
          {items.map((item) => (
            <ConversationBox 
              key={item.id} 
              data={item} 
              selected={conversationId === item.id}
            />
          ))}
        </div>
      </aside>
    </>
  );
}
 
export default ConversationList;