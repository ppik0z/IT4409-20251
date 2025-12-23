"use client";

import { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { format } from "date-fns";
import { IoClose, IoTrash, IoExit } from "react-icons/io5";
import { HiUserAdd } from "react-icons/hi";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Conversation, User } from "@prisma/client";
import useOtherUser from "@/hooks/useOtherUser";
import ConfirmModal from "@/app/components/ConfirmModal";
import AddMembersModal from "./AddMembersModal";
import MemberItem from "./MemberItem";
import useActiveList from "@/hooks/useActiveList";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: Conversation & { users: User[] };
  users: User[];
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose, data, users }) => {
  const otherUser = useOtherUser(data);
  const { user } = useUser();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { members } = useActiveList();
  const isActive = members.indexOf(otherUser?.externalId || '') !== -1;
  
  // --- LOGIC TÍNH TOÁN ---

  // 1. Tìm ID MongoDB của bản thân
  const myMongoId = useMemo(() => {
    return data.users.find((u) => u.email === user?.emailAddresses[0]?.emailAddress)?.id;
  }, [data.users, user]);

  // 2. Tiêu đề (Tên nhóm hoặc Tên người chat cùng)
  const title = useMemo(() => {
    return data.name || otherUser.username;
  }, [data.name, otherUser.username]);

  // 3. Trạng thái (Số thành viên hoặc text)
  const statusText = useMemo(() => {
    if (data.isGroup) {
      return `${data.users.length} thành viên`;
    }
    return 'Đang hoạt động';
  }, [data]);

  // 4. Kiểm tra quyền Admin/Mod
  const isAdmin = useMemo(() => {
    if (!data.isGroup) return true; // Chat 1-1 thì coi như admin
    return myMongoId && data.adminIds?.includes(myMongoId);
  }, [data, myMongoId]);

  // 5. Kiểm tra quyền thêm người
  const canAdd = useMemo(() => {
    if (!data.isGroup || !myMongoId) return false;
    return data.adminIds.includes(myMongoId) || data.moderatorIds.includes(myMongoId);
  }, [data, myMongoId]);


  return (
    <>
      {/* --- MODALS --- */}
      <ConfirmModal 
        isOpen={confirmOpen} 
        onClose={() => setConfirmOpen(false)} 
      />
      <AddMembersModal 
        users={users} 
        conversation={data} 
        isOpen={addModalOpen} 
        onClose={() => setAddModalOpen(false)} 
      />

      {/* --- DRAWER --- */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                      
                      {/* HEADER: Nút đóng */}
                      <div className="px-4 sm:px-6 flex items-start justify-end">
                        <button
                          type="button"
                          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                          onClick={onClose}
                        >
                          <span className="sr-only">Close panel</span>
                          <IoClose size={24} aria-hidden="true" />
                        </button>
                      </div>

                      {/* BODY: Nội dung chính */}
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">
                        <div className="flex flex-col items-center">
                          
                          {/* 1. Avatar Chính */}
                          <div className="mb-2 relative h-24 w-24">
                            <Image
                              fill
                              src={data.isGroup ? "/images/group_placeholder.jpg" : otherUser.image || '/images/placeholder.jpg'}
                              alt="Avatar"
                              className="rounded-full object-cover"
                            />
                            {!data.isGroup && isActive && (
                              <span 
                                className="absolute block rounded-full bg-green-500 ring-4 ring-white top-2 right-2 h-4 w-4" 
                              />
                            )}
                          </div>

                          {/* 2. Tên & Info */}
                          <div className="text-xl font-bold">{title}</div>
                          <div className="text-sm text-gray-500">{statusText}</div>

                          {/* 3. Các nút hành động (Action Buttons) */}
                          <div className="flex gap-10 my-8">
                            {/* Nút Thêm người */}
                            {canAdd && (
                              <div onClick={() => setAddModalOpen(true)} className="flex flex-col gap-3 items-center cursor-pointer hover:opacity-75 transition">
                                <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                                  <HiUserAdd size={20} className="text-black" />
                                </div>
                                <div className="text-sm font-light text-neutral-600">Thêm người</div>
                              </div>
                            )}

                            {/* Nút Xóa/Rời nhóm */}
                            <div onClick={() => setConfirmOpen(true)} className="flex flex-col gap-3 items-center cursor-pointer hover:opacity-75 transition">
                              <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                                {isAdmin ? <IoTrash size={20} className="text-red-600" /> : <IoExit size={20} className="text-gray-600" />}
                              </div>
                              <div className="text-sm font-light text-neutral-600">
                                {!data.isGroup ? "Xóa cuộc trò chuyện" : isAdmin ? "Giải tán nhóm" : "Rời nhóm"}
                              </div>
                            </div>
                          </div>

                          {/* 4. Thông tin chi tiết / Danh sách thành viên */}
                          <div className="w-full pb-5 pt-5 sm:px-0 sm:pt-0">
                            <dl className="space-y-8 px-4 sm:space-y-6 sm:px-6">
                              
                              {/* CASE 1: CHAT ĐÔI */}
                              {!data.isGroup && (
                                <div>
                                  <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:shrink-0">Email</dt>
                                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">{otherUser.email}</dd>
                                  <hr className="mt-4" />
                                  <dt className="mt-4 text-sm font-medium text-gray-500 sm:w-40 sm:shrink-0">Tham gia ngày</dt>
                                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                                    {format(new Date(otherUser.createdAt), 'PP')}
                                  </dd>
                                </div>
                              )}

                              {/* CASE 2: CHAT NHÓM */}
                              {data.isGroup && (
                                <div>
                                  <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:shrink-0 mb-4">
                                    Danh sách thành viên
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                                    <ul className="space-y-3">
                                      {data.users.map((u) => (
                                        <MemberItem 
                                          key={u.id}
                                          user={u}
                                          conversationId={data.id}
                                          currentUserId={myMongoId!}
                                          adminIds={data.adminIds}
                                          moderatorIds={data.moderatorIds}
                                        />
                                      ))}
                                    </ul>
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </div>

                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}

export default ProfileDrawer;