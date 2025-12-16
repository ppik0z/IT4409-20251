"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import clsx from "clsx";
import Image from "next/image";
import { format, isToday, isYesterday, isThisYear } from "date-fns";
import { vi } from "date-fns/locale"; 
import { HiDocumentArrowDown } from "react-icons/hi2";
import { FullMessageType } from "@/types";
import { CgSpinner } from "react-icons/cg"; 
// import ImageModal from "./ImageModal"; 

interface MessageBoxProps {
  data: FullMessageType;
  isLast?: boolean;
}

const MessageBox: React.FC<MessageBoxProps> = ({ data, isLast }) => {
  const { user } = useUser();
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const isOwn = user?.id === data.sender.externalId;
  const isOptimistic = data.id.startsWith("temp_");

  const seenList = (data.seen || [])
    .filter((seenUser) => seenUser.email !== data.sender.email) 
    .map((seenUser) => seenUser.username || seenUser.email)
    .join(', ');

  const container = clsx(
    "flex gap-3 p-4",
    isOwn && "justify-end"
  );
  const avatar = clsx(isOwn && "order-2");
  const body = clsx("flex flex-col gap-2", isOwn && "items-end");

  // --- HÀM FORMAT THỜI GIAN ---
  const formatMessageTime = (dateInput: Date | string) => {
    const date = new Date(dateInput);
    
    if (isToday(date)) {
      return format(date, 'p', { locale: vi });
    }

    if (isYesterday(date)) {
      return `Hôm qua, ${format(date, 'p', { locale: vi })}`;
    }

    if (isThisYear(date)) {
      return format(date, 'd MMM, p', { locale: vi });
    }

    return format(date, 'd MMM, yyyy, p', { locale: vi });
  };

  // --- LOGIC PHÂN LOẠI FILE 
  const contentUrl = data.fileUrl || data.image;
  let contentType = data.fileType;

  if (!contentType && contentUrl) {
      const extension = contentUrl.split('.').pop()?.toLowerCase();
      
      if (['mp4', 'webm', 'ogg', 'mov'].includes(extension || '')) {
          contentType = 'video';
      } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'rar', 'txt'].includes(extension || '')) {
          contentType = 'file';
      } else {
          contentType = 'image';
      }
  }

  const messageClass = clsx(
    "text-sm w-fit overflow-hidden shadow-sm",
    (contentType === 'image' || contentType === 'video') ? "rounded-md p-0 bg-transparent shadow-none border-none" : "rounded-2xl py-2 px-3",
    !(contentType === 'image' || contentType === 'video') && (
        isOwn ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white" : "bg-white border border-gray-100 text-gray-900"
    )
  );

  const renderMessageContent = () => {
    if (!contentUrl) return <div>{data.body}</div>;

    switch (contentType) {
      case 'image':
        return (
          <Image
            onClick={() => setImageModalOpen(true)}
            alt="Image"
            height="288"
            width="288"
            src={contentUrl}
            className="object-cover cursor-pointer hover:scale-105 transition translate rounded-md border border-gray-200"
          />
        );
      case 'video':
        return (
           <video controls width="288" className="rounded-md bg-black border border-gray-200">
              <source src={contentUrl} />
           </video>
        );
      case 'audio':
        return (
          <div className="flex items-center gap-2 min-w-[200px] p-1">
             <audio controls controlsList="nodownload" className="w-full h-8 accent-white">
                <source src={contentUrl} />
                Trình duyệt không hỗ trợ.
             </audio>
          </div>
        );
      case 'file':
        return (
          <a 
            href={contentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={clsx(
              "flex items-center gap-3 p-2 rounded-lg transition max-w-xs",
              isOwn ? "hover:bg-white/20" : "hover:bg-gray-100"
            )}
          >
            <HiDocumentArrowDown size={24} className={isOwn ? "text-white" : "text-gray-500"} />
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-sm truncate w-40">
                {data.fileName || contentUrl.split('/').pop()}
              </span>
              <span className="text-[10px] opacity-80 uppercase">
                {contentUrl.split('.').pop()} - Nhấn tải về
              </span>
            </div>
          </a>
        );
      case 'text':
      default:
        return <div>{data.body}</div>;
    }
  };

  return (
    <div className={container}>
      <div className={avatar}>
        <div className="relative h-8 w-8">
           <Image
             fill
             src={data.sender.image || "/images/placeholder.jpg"}
             alt="Avatar"
             className="rounded-full object-cover shadow-sm"
           />
        </div>
      </div>

      <div className={body}>
        <div className="flex items-center gap-1">
          <div className="text-sm text-gray-500">
            {data.sender.username || data.sender.email}
          </div>
          
          <div className="text-[10px] text-gray-400">
            {formatMessageTime(new Date(data.createdAt))}
          </div>

        </div>

        <div className={messageClass}>
           {/* ImageModal component placeholder */}
           <div className="relative">
              {renderMessageContent()}
              {isOptimistic && (data.fileUrl || data.image) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md z-10">
                      <CgSpinner size={30} className="text-white animate-spin" />
                  </div>
              )}
           </div>
        </div>

        {isLast && isOwn && seenList.length > 0 && (
          <div className="text-xs font-light text-gray-500 mt-1">{`Đã xem bởi ${seenList}`}</div>
        )}
        
        {isLast && isOwn && seenList.length === 0 && !isOptimistic && (
           <div className="text-xs font-light text-gray-400 mt-1">Đã gửi</div>
        )}

        {isOwn && isOptimistic && (
           <div className="text-xs font-light text-gray-400 mt-1 italic">Đang gửi...</div>
        )}
      </div>
    </div>
  );
}

export default MessageBox;