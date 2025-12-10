import DesktopSidebar from "./DesktopSidebar";
import MobileFooter from "./MobileFooter";
import { getCurrentUser } from "@/app/actions/getUser";
import getUnreadConversations from "@/app/actions/getUnreadConversations";

async function Sidebar({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();
  const unreadConversations = await getUnreadConversations(); 

  return (
    <div className="h-full">
      <DesktopSidebar 
        currentUser={currentUser!} 
        unreadConversations={unreadConversations}
      />
      <MobileFooter />
      <main className="lg:pl-20 h-full">
        {children}
      </main>
    </div>
  );
}

export default Sidebar;