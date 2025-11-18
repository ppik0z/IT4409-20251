"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { User } from "@prisma/client"; 
import Image from "next/image";        

interface UserBoxProps {
  data: User; 
}

const UserBox: React.FC<UserBoxProps> = ({ data }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(() => {
    setIsLoading(true);

    axios.post('/api/conversations', {
      userId: data.id
    })
    .then((res) => {
      router.push(`/conversations/${res.data.id}`);
    })
    .catch(() => {
        // Có thể thêm thông báo lỗi sau này
    })
    .finally(() => setIsLoading(false));
  }, [data, router]);

  return ( 
    <div 
      onClick={handleClick}
      className="w-full relative flex items-center space-x-3 bg-white p-3 hover:bg-neutral-100 rounded-lg transition cursor-pointer border border-transparent hover:border-neutral-200"
    >
      <div className="relative inline-block rounded-full overflow-hidden h-9 w-9 md:h-11 md:w-11">
         <Image 
            fill
            src={data.image || "/images/placeholder.jpg"}
            alt="Avatar"
            className="object-cover"
         />
      </div>

      <div className="min-w-0 flex-1 focus:outline-none">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm font-medium text-gray-900">
            {data.username}
          </p>
        </div>
        <p className="text-xs text-gray-500 truncate">
          {isLoading ? "Đang tạo..." : "Bấm để nhắn tin"}
        </p>
      </div>
    </div>
  );
}
 
export default UserBox;