"use client";

import { User } from "@prisma/client";
import useOtherUser from "@/hooks/useOtherUser";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Conversation } from "@prisma/client";
import Image from "next/image"; 
import ActiveCallModal from "@/app/components/ActiveCallModal";
import { HiPhone } from "react-icons/hi2";
import { HiChevronLeft, HiEllipsisHorizontal } from "react-icons/hi2"; 
import { HiMagnifyingGlass } from "react-icons/hi2";
import Avatar from "@/app/components/Avatar"; 
import ProfileDrawer from "./ProfileDrawer"; 
import useActiveList from "@/hooks/useActiveList"; 
import useSearchModal from "@/hooks/useSearchModal";

interface HeaderProps {
  conversation: Conversation & {users: User[]};
  users: User[];
};

const Header: React.FC<HeaderProps> = ({ conversation, users }) => {
  const otherUser = useOtherUser(conversation);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false); 
  const searchModal = useSearchModal();

  const { members } = useActiveList();
  

  const isActive = members.indexOf(otherUser?.externalId || '') !== -1;

  const statusText = useMemo(() => {
    if (conversation.isGroup) {
      const activeCount = conversation.users.filter((user) => 
        members.indexOf(user.externalId || '') !== -1
      ).length;
      return `${conversation.users.length} thành viên, ${activeCount} đang hoạt động`;
    }
    

    return isActive ? "Đang hoạt động" : "Off";
    
  }, [conversation, isActive, members]);

  return (
    <>
      <ActiveCallModal 
        isOpen={isCallOpen} 
        onClose={() => setIsCallOpen(false)} 
        conversationId={conversation.id}
      />
      <ProfileDrawer 
        data={conversation} 
        users={users}
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
      />

      <div className="bg-white w-full flex border-b-blue-200 sm:px-4 py-3 px-4 lg:px-6 justify-between items-center shadow-sm z-40">
        
        <div className="flex gap-3 items-center">
          
          <Link 
            href="/conversations" 
            className="
              lg:hidden 
              block 
              text-sky-500 
              hover:text-sky-600 
              transition 
              cursor-pointer 
              p-2 
              -ml-2 
              rounded-full 
              hover:bg-sky-100
            "
          >
            <HiChevronLeft size={28} />
          </Link>

          {conversation.isGroup ? (
             <div className="relative h-9 w-9 md:h-11 md:w-11">
                <Image
                  fill
                  src="/images/group_placeholder.jpg" 
                  alt="Avatar" 
                  className="rounded-full object-cover"
                />
             </div>
          ) : (
              <Avatar user={otherUser} isActive={isActive} />
          )}

          <div className="flex flex-col">
            <div className="font-bold text-gray-900 truncate max-w-[200px] sm:max-w-md">
              {conversation.name || otherUser?.username}
            </div>
            <div className="text-sm font-light text-neutral-500">
              {statusText} 
            </div>
          </div>
        </div>
        
        <div className="flex gap-1 items-center">

          <div 
            onClick={() => searchModal.isOpen ? searchModal.onClose() : searchModal.onOpen()}
            className="
              p-2 rounded-full text-sky-500 hover:bg-sky-100 
              hover:text-sky-600 cursor-pointer transition
            "
          >
            <HiMagnifyingGlass size={24} />
          </div>

          <div 
            onClick={() => setIsCallOpen(true)}
            className="
            p-2 
            rounded-full 
            text-sky-500 
            hover:bg-sky-100 
            hover:text-sky-600 
            cursor-pointer 
            transition
          ">
            <HiPhone size={24} />
          </div>
        
          <div 
            onClick={() => setDrawerOpen(true)}
            className="
              p-2 
              rounded-full 
              text-sky-500 
              hover:bg-sky-100 
              hover:text-sky-600 
              cursor-pointer 
              transition
            "
          >
            <HiEllipsisHorizontal size={24} />
          </div>

        </div>
      </div>
    </>
  );
}
 
export default Header;