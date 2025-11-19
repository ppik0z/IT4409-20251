import { getCurrentUser } from "@/app/actions/getUser";
import MobileFooter from "./MobileFooter";

async function Sidebar({ children }: { children: React.ReactNode }) {
  // Lấy user hiện tại để sau này hiện Avatar
  const currentUser = await getCurrentUser();

  return (
    <div className="h-full">
      {/* Sau này DesktopSidebar sẽ nằm ở đây */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-20 xl:px-6 lg:overflow-y-auto lg:bg-white lg:border-r lg:pb-4 lg:flex lg:flex-col justify-between">
        <nav className="mt-4 flex flex-col justify-between">
          <ul role="list" className="flex flex-col items-center space-y-1">
            {/* Chỗ này sau sẽ là các icon: Chat, Users, Logout */}
            <li className="text-gray-500 text-xs">Menu</li>
          </ul>
        </nav>
      </div>

      <MobileFooter />

      {/* Phần nội dung chính (Chat) */}
      <main className="lg:pl-20 h-full">
        {children}
      </main>
    </div>
  );
}

export default Sidebar;