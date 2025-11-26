"use client";

import clsx from "clsx";
import useConversation from "@/hooks/useConversation";
import EmptyState from "@/app/components/EmptyState";

const Home = () => {
  const { isOpen } = useConversation();

  return (
    <div className={clsx(
      "lg:pl-80 h-full lg:block", // Desktop: Luôn hiện, cách lề trái 80 (chừa chỗ cho list)
      isOpen ? 'block' : 'hidden' // Mobile: Chỉ hiện khi ĐANG mở chat 
    )}>
      <EmptyState />
    </div>
  );
}

export default Home;