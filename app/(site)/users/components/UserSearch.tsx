"use client";

import { useState, useMemo } from "react";
import { User } from "@prisma/client";
import UserBox from "./UserBox";
import { HiMagnifyingGlass } from "react-icons/hi2";

interface UserSearchProps {
  items: User[];
}

const UserSearch: React.FC<UserSearchProps> = ({ items }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = useMemo(() => {
    return items.filter((user) => 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, items]);

  return (
    <div className="flex flex-col gap-y-4">
      <div className="relative">
        <HiMagnifyingGlass 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
          size={20} 
        />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm người dùng..."
          className="w-full pl-10 pr-4 py-2 bg-neutral-100 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 transition"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <UserBox key={user.id} data={user} />
          ))
        ) : (
          <p className="text-neutral-500 text-sm italic">Không tìm thấy người dùng nào.</p>
        )}
      </div>
    </div>
  );
};

export default UserSearch;