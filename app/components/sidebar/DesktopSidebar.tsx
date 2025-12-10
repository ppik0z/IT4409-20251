"use client";

import useRoutes from "@/hooks/useRoutes";
import DesktopItem from "./DesktopItem";
import { UserButton } from "@clerk/nextjs"; 
import { User } from "@prisma/client";
import NotificationButton from "@/app/components/notifications/NotificationButton"; 
import { FullConversationType } from "@/types";

interface DesktopSidebarProps {
  currentUser: User | null;
  unreadConversations: FullConversationType[]; // Nhận dữ liệu từ cha
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ 
  unreadConversations = []
}) => {
  const routes = useRoutes();

  return ( 
    <>

      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-20 lg:px-6 lg:overflow-y-auto lg:bg-white lg:border-r lg:border-blue-100 lg:pb-4 lg:flex lg:flex-col justify-between">
        <nav className="mt-4 flex flex-col justify-between">
          <ul role="list" className="flex flex-col items-center space-y-1">
            
            {/* 1. Các nút điều hướng cơ bản (Chat, Users) */}
            {routes.map((item) => (
              <DesktopItem
                key={item.label}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={item.active}
                onClick={item.onClick}
              />
            ))}

            {/* 2. Nút Thông báo */}
            <li>
              <NotificationButton initialItems={unreadConversations} />
            </li>


          </ul>
        </nav>

        <nav className="mt-4 flex flex-col justify-between items-center">
          <div className="cursor-pointer hover:opacity-75 transition">
            <UserButton afterSignOutUrl="/"/>
          </div>
        </nav>
      </div>
    </>
   );
}
 
export default DesktopSidebar;