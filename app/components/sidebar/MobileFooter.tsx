"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MobileFooter = () => {
  const pathname = usePathname();
  
  // Logic kiểm tra đang ở trang nào để bôi đậm icon
  const routes = [
    { label: 'Chat', href: '/conversations', active: pathname === '/conversations' },
    { label: 'Mọi người', href: '/users', active: pathname === '/users' },
  ];

  // Nếu đang ở trong cuộc trò chuyện cụ thể thì ẩn Footer đi
  if (!!pathname && pathname.includes("/conversations/")) {
    return null; 
  }

  return (
    <div className="fixed justify-between w-full bottom-0 z-40 flex items-center bg-white border-t lg:hidden">
      {routes.map((route) => (
        <Link 
          key={route.href} 
          href={route.href}
          className={`group flex gap-x-3 text-sm leading-6 font-semibold w-full justify-center p-4 text-gray-500 hover:text-black hover:bg-gray-100
            ${route.active ? 'text-black bg-gray-100' : ''}
          `}
        >
          {route.label}
        </Link>
      ))}
    </div>
  );
}

export default MobileFooter;