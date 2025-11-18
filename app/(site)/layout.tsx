import Sidebar from "@/app/components/sidebar/Sidebar";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Sidebar>
      <div className="h-full">
        {children}
      </div>
    </Sidebar>
  )
}