"use client";

import { useUser } from "@clerk/nextjs";
import { FullMessageType } from "@/types"; // Import type
import clsx from "clsx";
import Image from "next/image";
import { format } from "date-fns";
import { HiDocumentArrowDown } from "react-icons/hi2";

interface MessageBoxProps {
  data: FullMessageType;
  isLast?: boolean;
}

// Hàm lấy tên file từ URL
const getFileName = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

const MessageBox: React.FC<MessageBoxProps> = ({ data, isLast }) => {
  const { user } = useUser();
  const isOwn = user?.id === data.sender.externalId;

  // Danh sách những người đã xem (trừ bản thân mình ra)
  const seenList = (data.seen || [])
    .filter((seenUser) => seenUser.email !== data.sender.email)
    .map((seenUser) => seenUser.username)
    .join(', ');

  // Class cho Container chính
  const container = clsx(
    "flex gap-3 p-4", 
    isOwn && "justify-end"
  );

  const avatar = clsx(isOwn && "order-2");

  const body = clsx(
    "flex flex-col gap-2", 
    isOwn && "items-end"
  );

  // Class cho Bong bóng chat (Xịn xò ở đây này)
  const message = clsx(
    "text-sm w-fit overflow-hidden shadow-sm", 
    // Nếu là tin của mình -> Gradient xanh + chữ trắng
    isOwn ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white" : "bg-white border border-gray-100 text-gray-900", 
    // Bo góc tròn trịa
    "rounded-2xl py-2 px-3",
    // Nếu là ảnh/video thì bỏ padding để full viền
    (data.image) ? "rounded-md p-0 bg-transparent shadow-none border-none" : ""
  );

  // Logic kiểm tra loại file (như cũ)
  const getFileType = (url: string | null) => {
    if (!url) return "text";
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return "image";
    if (['mp4', 'webm', 'ogg', 'mov'].includes(extension || '')) return "video";
    return "file";
  }
  const fileType = getFileType(data.image);

  return ( 
    <div className={container}>
      {/* Avatar */}
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
        {/* Tên người gửi + Thời gian */}
        <div className="flex items-center gap-1">
          <div className="text-sm text-gray-500">
            {data.sender.username}
          </div>
          <div className="text-[10px] text-gray-400">
            {format(new Date(data.createdAt), 'p')}
          </div>
        </div>

        {/* Nội dung tin nhắn */}
        <div className={message}>
           {!data.image ? (
             // Nội dung text bình thường
             <div>{data.body}</div>
           ) : (
             <>
                {/* Ảnh */}
                {fileType === "image" && (
                   <Image 
                     alt="Image" height="288" width="288" src={data.image} 
                     className="object-cover cursor-pointer hover:scale-105 transition translate rounded-md border border-gray-200"
                   />
                )}
                
                {/* Video */}
                {fileType === "video" && (
                   <video controls width="288" className="rounded-md bg-black border border-gray-200">
                     <source src={data.image} />
                   </video>
                )}

                {/* File tài liệu (Style lại cho đẹp) */}
                {fileType === "file" && (
                   <a 
                     href={data.image} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className={clsx(
                        "flex items-center gap-3 p-3 rounded-lg transition max-w-xs",
                        // Nếu là tin mình thì nền trắng chữ đen (vì bong bóng đã xanh)
                        // Nếu là tin bạn thì nền xám nhạt
                        isOwn ? "bg-white/20 text-white hover:bg-white/30" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                     )}
                   >
                      <HiDocumentArrowDown size={24} />
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold text-sm truncate w-40">
                          {data.fileName || getFileName(data.image!)} 
                        </span>
                        <span className="text-[10px] opacity-80 uppercase">
                          {data.image?.split('.').pop()} - Nhấn tải về
                        </span>
                      </div>
                   </a>
                )}
             </>
           )}
        </div>

        {/* Trạng thái Đã xem / Đã gửi */}
        {isLast && isOwn && seenList.length > 0 && (
            <div className="text-xs font-light text-gray-500 mt-1">
                {`Đã xem bởi ${seenList}`}
            </div>
        )}
        {/* Nếu chưa ai xem thì hiện Đã gửi */}
        {isLast && isOwn && seenList.length === 0 && (
            <div className="text-xs font-light text-gray-400 mt-1">
                Đã gửi
            </div>
        )}

      </div>
    </div>
  );
}
 
export default MessageBox;