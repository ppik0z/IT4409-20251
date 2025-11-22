"use client";

import { User } from "@prisma/client";
import useOtherUser from "@/hooks/useOtherUser";
import { useMemo } from "react";
import Link from "next/link";
import { Conversation } from "@prisma/client";
import Image from "next/image";

interface HeaderProps {
  conversation: Conversation & {
    users: User[]
  }
};

const Header: React.FC<HeaderProps> = ({ conversation }) => {
  const otherUser = useOtherUser(conversation); 

  const statusText = useMemo(() => {
    if (conversation.isGroup) {
      return `${conversation.users.length} thành viên`;
    }
    return "Đang hoạt động"; // Sau này làm tính năng Online/Offline sau
  }, [conversation]);

  return (
    <div className="bg-white w-full flex border-b sm:px-4 py-3 px-4 lg:px-6 justify-between items-center shadow-sm">
      <div className="flex gap-3 items-center">
        {/* Nút Back cho Mobile */}
        <Link href="/conversations" className="lg:hidden block text-blue-500 hover:text-blue-600 transition cursor-pointer">
          ← Back
        </Link>

        {/* Avatar */}
        <div className="relative h-9 w-9 md:h-11 md:w-11">
          <Image
              fill
              src={conversation.isGroup ? "/images/group_placeholder.jpg" : otherUser?.image || '/images/placeholder.jpg'} 
              alt="Avatar" 
              className="rounded-full object-cover"
            />
        </div>

        {/* Tên & Trạng thái */}
        <div className="flex flex-col">
          <div className="font-bold">
            {conversation.name || otherUser?.username}
          </div>
          <div className="text-sm font-light text-neutral-500">
            {statusText}
          </div>
        </div>
      </div>
      
      {/* Nút chức năng (ví dụ: gọi điện, menu) - Để sau */}
      <div className="text-blue-500 cursor-pointer hover:text-blue-600">
        ...
      </div>
    </div>
  );
}
 
export default Header;