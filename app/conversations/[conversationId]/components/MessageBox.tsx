"use client";

import { useUser } from "@clerk/nextjs";
import { FullMessageType } from "@/types";
import clsx from "clsx";
import Image from "next/image";
import { format } from "date-fns";

interface MessageBoxProps {
  data: FullMessageType;
  isLast?: boolean;
}

const MessageBox: React.FC<MessageBoxProps> = ({ data, isLast }) => {
  const { user } = useUser();
  
  // Check sender 
  const isOwn = user?.emailAddresses[0]?.emailAddress === data.sender.email;


  const container = clsx("flex gap-3 p-4", isOwn && "justify-end");
  const avatar = clsx(isOwn && "order-2");
  const body = clsx("flex flex-col gap-2", isOwn && "items-end");
  const message = clsx(
    "text-sm w-fit overflow-hidden", 
    isOwn ? "bg-blue-500 text-white" : "bg-gray-100", 
    data.image ? "rounded-md p-0" : "rounded-full py-2 px-3"
  );

  return ( 
    <div className={container}>
      {/* Avatar */}
      <div className={avatar}>
        <div className="relative h-8 w-8">
           <Image 
             fill 
             src={data.sender.image || "/images/placeholder.jpg"} 
             alt="Avatar" 
             className="rounded-full object-cover"
           />
        </div>
      </div>

      {/* Tin nhắn */}
      <div className={body}>
        <div className="flex items-center gap-1">
          <div className="text-sm text-gray-500">
            {data.sender.username}
          </div>
          <div className="text-xs text-gray-400">
            {format(new Date(data.createdAt), 'p')}
          </div>
        </div>

        <div className={message}>
           {/* Ảnh */}
           {data.image ? (
             <Image 
               alt="Image"
               height="288"
               width="288"
               src={data.image}
               className="object-cover cursor-pointer hover:scale-110 transition translate"
             />
           ) : (
             <div>{data.body}</div>
           )}
        </div>
        
        {/* (Seen) - Làm sau */}
      </div>
    </div>
  );
}
 
export default MessageBox;