"use client";

import { User } from "@prisma/client";
import useOtherUser from "@/hooks/useOtherUser";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Conversation } from "@prisma/client";
import Image from "next/image"; 
import ActiveCallModal from "@/app/components/ActiveCallModal";
import { HiPhone, HiVideoCamera } from "react-icons/hi2";
import { HiChevronLeft, HiEllipsisHorizontal } from "react-icons/hi2"; 

import Avatar from "@/app/components/Avatar"; 
import ProfileDrawer from "./ProfileDrawer"; 
import useActiveList from "@/hooks/useActiveList"; 

interface HeaderProps {
  conversation: Conversation & {users: User[]};
  users: User[];
};

const Header: React.FC<HeaderProps> = ({ conversation, users }) => {
  const otherUser = useOtherUser(conversation);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false); 
  

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

      <div className="bg-white w-full flex border-b-blue-200 sm:px-4 py-3 px-4 lg:px-6 justify-between items-center shadow-sm">
        
        <div className="flex gap-3 items-center">
          
          <Link 
            href="/conversations" 
            className="lg:hidden block text-blue-500 hover:text-blue-600 transition cursor-pointer"
          >
            <HiChevronLeft size={32} />
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
             <Avatar user={otherUser} />
          )}

          <div className="flex flex-col">
            <div className="font-bold">
              {conversation.name || otherUser?.username}
            </div>
            <div className="text-sm font-light text-neutral-500">
              {statusText} 
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">


            <HiPhone
               onClick={() => {
                setIsCallOpen(true)
               }}
               size={28} 
               className="text-blue-500 cursor-pointer hover:text-blue-600 transition"
            />
        
            <HiEllipsisHorizontal
              size={32}
              onClick={() => setDrawerOpen(true)}
              className="text-blue-500 cursor-pointer hover:text-blue-600 transition"
            />

        </div>
      </div>
    </>
  );
}
 
export default Header;