import DesktopSidebar from "./DesktopSidebar";
import { currentUser } from "@clerk/nextjs/server";

async function Sidebar({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  return (
    <div className="h-full">
      <DesktopSidebar currentUser={null} />
      
      <main className="lg:pl-20 h-full">
        {children}
      </main>
    </div>
  );
}

export default Sidebar;