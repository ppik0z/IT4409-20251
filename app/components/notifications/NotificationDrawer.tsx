"use client";

import { Fragment, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { IoClose } from "react-icons/io5";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Conversation, Message, User } from "@prisma/client";
import useOtherUser from "@/hooks/useOtherUser";

// Kiểu dữ liệu mở rộng cho Conversation
type FullConversationType = Conversation & {
  users: User[];
  messages: (Message & { sender: User })[];
};

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: FullConversationType[]; 
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ 
  isOpen, 
  onClose, 
  items = [] 
}) => {
  const router = useRouter();

  const handleClick = (conversationId: string) => {
    router.push(`/conversations/${conversationId}`);
    onClose(); 
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                    
                    <div className="px-4 sm:px-6 flex items-center justify-between">
                      <h2 className="text-base font-semibold leading-6 text-gray-900">
                        Thông báo ({items.length})
                      </h2>
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={onClose}
                      >
                        <IoClose size={24} />
                      </button>
                    </div>

                    {/* DANH SÁCH THÔNG BÁO */}
                    <div className="mt-6 flex-1 px-4 sm:px-6">
                      <div className="flex flex-col gap-4">
                        {items.length === 0 && (
                          <div className="text-center text-gray-500 mt-10">
                            Không có tin nhắn mới nào.
                          </div>
                        )}
                        
                        {items.map((item) => (
                           <NotificationItem 
                              key={item.id} 
                              data={item} 
                              onClick={() => handleClick(item.id)} 
                           />
                        ))}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

// Component con để hiển thị từng dòng thông báo
const NotificationItem = ({ data, onClick }: { data: FullConversationType, onClick: () => void }) => {
    const otherUser = useOtherUser(data);
    const lastMessage = data.messages[0];

    const messageContent = useMemo(() => {
        if (lastMessage?.image) return "Đã gửi một hình ảnh";
        if (lastMessage?.body) return lastMessage.body;
        return "Đã gửi một file";
    }, [lastMessage]);

    const previewText = useMemo(() => {
        if (data.isGroup && lastMessage?.sender?.username) {
            return `${lastMessage.sender.username}: ${messageContent}`;
        }
        return messageContent;
    }, [data.isGroup, lastMessage, messageContent]);
    
    return (
        <div 
            onClick={onClick}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100 cursor-pointer bg-blue-50 transition"
        >
            {/* Avatar */}
            <div className="relative h-12 w-12 shrink-0">
                <Image
                    fill
                    className="rounded-full object-cover"
                    src={data.isGroup ? "/images/group_placeholder.jpg" : otherUser.image || "/images/placeholder.jpg"}
                    alt="Avatar"
                />
            </div>

            {/* Nội dung */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                        {data.name || otherUser.username}
                    </p>
                    <p className="text-xs text-gray-400 font-light">
                        {lastMessage?.createdAt && format(new Date(lastMessage.createdAt), 'p')}
                    </p>
                </div>
                
                {/* previewText */}
                <p className="text-sm text-blue-600 font-medium truncate">
                    {previewText}
                </p>
            </div>
            
            {/* Chấm xanh chưa đọc */}
            <div className="h-2.5 w-2.5 bg-blue-600 rounded-full shrink-0" />
        </div>
    )
}

export default NotificationDrawer;