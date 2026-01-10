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
import { HiMagnifyingGlass } from "react-icons/hi2";

interface ConversationListProps {
  initialItems: FullConversationType[];
  users: User[];
}

const ConversationList: React.FC<ConversationListProps> = ({ initialItems, users }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState(initialItems);

  // Logic lọc danh sách hội thoại
  const [searchTerm, setSearchTerm] = useState("");
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter((conversation) => {
      if (conversation.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return true;
      }
      return conversation.users.some((user) => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm, items]);

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
        const listWithoutUpdated = current.filter((c) => c.id !== conversation.id);
        return [conversation, ...listWithoutUpdated];
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

    const seenHandler = (conversation: FullConversationType) => {
      setItems((current) => current.map((currentConversation) => {
        if (currentConversation.id === conversation.id) {
          return {
            ...currentConversation,
            messages: conversation.messages
          };
        }
        return currentConversation;
      }));
    };

    pusherClient.bind('conversation:update', updateHandler);
    pusherClient.bind('conversation:new', newHandler); 
    pusherClient.bind('conversation:remove', removeHandler);
    pusherClient.bind('message:update', seenHandler);

    return () => {
      pusherClient.unsubscribe(pusherKey);
      pusherClient.unbind('conversation:update', updateHandler);
      pusherClient.unbind('conversation:new', newHandler);
      pusherClient.unbind('conversation:remove', removeHandler);
      pusherClient.unbind('message:update', seenHandler);
    }
  }, [pusherKey, conversationId, router]);

  return (
  <> 
    <GroupChatModal 
        users={users} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    <aside className={clsx(`
        fixed 
        inset-y-0 
        pb-20 
        lg:pb-0 
        lg:left-20 
        lg:w-80 
        lg:block 
        overflow-y-auto 
        border-r 
        border-gray-200
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
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiMagnifyingGlass className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm hội thoại"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              block 
              w-full 
              pl-10 
              pr-3 
              py-2 
              border-none 
              rounded-full 
              bg-gray-100 
              text-sm 
              placeholder-gray-500 
              focus:ring-0 
              focus:bg-gray-200 
              transition
              outline-none
            "
          />
        </div>

        {filteredItems.map((item) => (
          <ConversationBox
            key={item.id}
            data={item}
          />
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-10">
            Không tìm thấy kết quả phù hợp
          </div>
        )}
      </div>
    </aside>
  </>
  );
};

export default ConversationList;