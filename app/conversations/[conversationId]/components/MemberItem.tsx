"use client";

import { User } from "@prisma/client";
import Avatar from "@/app/components/Avatar";
import { useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { HiEllipsisVertical, HiShieldCheck, HiTrash, HiUserMinus, HiChevronDoubleDown } from "react-icons/hi2";
import axios from "axios";
import { useRouter } from "next/navigation";
import clsx from "clsx";

interface MemberItemProps {
  user: User;
  conversationId: string;
  currentUserId: string; 
  adminIds: string[];
  moderatorIds: string[];
}

const MemberItem: React.FC<MemberItemProps> = ({ 
  user, conversationId, currentUserId, adminIds = [], moderatorIds = [] 
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Xác định vai trò
  const isAdmin = adminIds.includes(user.id);
  const isMod = moderatorIds.includes(user.id);
  const isMe = currentUserId === user.id;

  const amIAdmin = adminIds.includes(currentUserId);
  const amIMod = moderatorIds.includes(currentUserId);

  // Quyền hạn:
  // - Admin: Quản lý tất cả (trừ chính mình)
  // - Mod: Chỉ quản lý Member thường (không phải Admin/Mod/Chính mình)
  const canManage = !isMe && (amIAdmin || (amIMod && !isAdmin && !isMod));

  const handleAction = (action: string) => {
    setIsLoading(true);
    axios.post(`/api/conversations/${conversationId}/management`, {
        action: action,
        targetId: user.id
    })
    .then(() => router.refresh())
    .catch(() => alert("Thất bại!"))
    .finally(() => setIsLoading(false));
  }

  return (
    <li className="flex items-center justify-between gap-3 p-2 hover:bg-gray-50 rounded-md transition group">
      <div className="flex items-center gap-3">
        <Avatar user={user} />
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-gray-900">{user.username}</span>
            {isAdmin && <HiShieldCheck className="text-red-500" title="Admin" />}
            {isMod && <HiShieldCheck className="text-blue-500" title="Moderator" />}
          </div>
          <span className="text-xs text-gray-500">{user.email}</span>
        </div>
      </div>

      {/* MENU 3 CHẤM (Chỉ hiện nếu có quyền) */}
      {canManage && (
        <Menu as="div" className="relative ml-3">
          <div>
            <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600">
              <HiEllipsisVertical size={20} />
            </Menu.Button>
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              
              {/* Nút Kick */}
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleAction('kick')}
                    className={clsx(
                      active ? 'bg-gray-100' : '',
                      'flex w-full px-4 py-2 text-sm text-red-600'
                    )}
                  >
                    <HiUserMinus className="mr-2 h-5 w-5" /> Đá khỏi nhóm
                  </button>
                )}
              </Menu.Item>

              {/* Nút Thăng chức (Chỉ Admin mới thấy) */}
              {amIAdmin && !isMod && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleAction('promote')}
                      className={clsx(
                        active ? 'bg-gray-100' : '',
                        'flex w-full px-4 py-2 text-sm text-gray-700'
                      )}
                    >
                      <HiShieldCheck className="mr-2 h-5 w-5 text-blue-500" /> Đột phá làm tiên
                    </button>
                  )}
                </Menu.Item>
              )}

              {/* Nút Giáng chức (Chỉ Admin mới thấy, và chỉ áp dụng cho Mod) */}
              {amIAdmin && isMod && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleAction('demote')}
                      className={clsx(
                        active ? 'bg-gray-100' : '',
                        'flex w-full px-4 py-2 text-sm text-gray-700'
                      )}
                    >
                      <HiChevronDoubleDown className="mr-2 h-5 w-5" /> Tẩu hỏa nhập ma
                    </button>
                  )}
                </Menu.Item>
              )}

            </Menu.Items>
          </Transition>
        </Menu>
      )}
    </li>
  );
}

export default MemberItem;