import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { 
  HiChatBubbleLeftEllipsis, 
  HiUsers, 
  HiUser, 
  HiCog, 
  HiBell, 
  HiSquares2X2 
} from "react-icons/hi2";
import useConversation from "./useConversation";

const useRoutes = () => {
  const pathname = usePathname();
  const { conversationId } = useConversation();

  const routes = useMemo(() => [
    {
      label: 'Chat',
      href: '/conversations',
      icon: HiChatBubbleLeftEllipsis,
      active: pathname === '/conversations' || !!conversationId
    },
    {
      label: 'Mọi người', // Trang Users
      href: '/users',
      icon: HiUsers,
      active: pathname === '/users'
    },
    {
      label: 'Hồ sơ', // Trang Profile (Cover, Bio, Posts...)
      href: '/profile', 
      icon: HiUser,
      active: pathname === '/profile'
    },
    {
      label: 'Thông báo',
      href: '/notifications',
      icon: HiBell,
      active: pathname === '/notifications'
    },
    {
      label: 'Cài đặt',
      href: '/settings',
      icon: HiCog,
      active: pathname === '/settings'
    },
    {
      label: 'Khác', // Nút bí ẩn em chưa nghĩ ra
      href: '#',
      icon: HiSquares2X2, 
      onClick: () => console.log('Tính năng đang phát triển...'),
      active: false,
    },
  ], [pathname, conversationId]);

  return routes;
};

export default useRoutes;