"use client";

import { useEffect, useState } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import NotificationDrawer from "./NotificationDrawer";
import { FullConversationType } from "@/types"; 
import { useUser } from "@clerk/nextjs";
import { pusherClient } from "@/lib/pusher";
import useConversation from "@/hooks/useConversation"; 

interface NotificationButtonProps {
    initialItems: FullConversationType[]; 
}

const NotificationButton: React.FC<NotificationButtonProps> = ({ initialItems = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState(initialItems);
    
    const { user } = useUser();
    const { conversationId } = useConversation();

    useEffect(() => {
        if (conversationId) {
            const timer = setTimeout(() => {
                setItems((current) => current.filter((item) => item.id !== conversationId));
            }, 1);

            return () => clearTimeout(timer);
        }
    }, [conversationId]);
    useEffect(() => {
        if (!user?.primaryEmailAddress?.emailAddress) {
            return;
        }

        const channelName = user.primaryEmailAddress.emailAddress;
        pusherClient.subscribe(channelName);

        const updateHandler = (conversation: FullConversationType) => {
            setItems((current) => {
                if (conversationId === conversation.id) {
                    return current;
                }

                const lastMessage = conversation.messages?.[0];
                if (!lastMessage) return current;

                // Nếu mình gửi -> Xóa khỏi list
                const isOwn = lastMessage.senderId === user.id;
                if (isOwn) {
                    return current.filter(c => c.id !== conversation.id);
                }

                // Nếu người khác gửi -> Thêm vào list
                return [conversation, ...current.filter(c => c.id !== conversation.id)];
            });
        };

        const newHandler = (conversation: FullConversationType) => {
             setItems((current) => {
                //đang ở trong phòng chat mới tạo này -> Không báo
                if (conversationId === conversation.id) {
                    return current;
                }

                const lastMessage = conversation.messages[0];
                if (!lastMessage) return current;
                if (lastMessage.senderId === user.id) return current;

                return [conversation, ...current];
            });
        };

        pusherClient.bind('conversation:update', updateHandler);
        pusherClient.bind('conversation:new', newHandler);

        return () => {
            pusherClient.unsubscribe(channelName);
            pusherClient.unbind('conversation:update', updateHandler);
            pusherClient.unbind('conversation:new', newHandler);
        }
    }, [user?.primaryEmailAddress?.emailAddress, user?.id, conversationId]);

    return (
        <>
            <NotificationDrawer 
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)} 
                items={items} 
            />
            
            <div 
                onClick={() => setIsOpen(true)} 
                className="group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold text-gray-500 hover:text-black hover:bg-gray-100 cursor-pointer relative"
            >
                <IoNotificationsOutline className="h-6 w-6 shrink-0" />
                <span className="sr-only">Thông báo</span>

                {items.length > 0 && (
                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                        {items.length > 9 ? '9+' : items.length}
                    </span>
                )}
            </div>
        </>
    );
}

export default NotificationButton;