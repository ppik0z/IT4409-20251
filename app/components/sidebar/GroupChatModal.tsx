"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { User } from "@prisma/client";
import Select from "react-select"; 


import Modal from "../Modal";

interface GroupChatModalProps {
  isOpen?: boolean;
  onClose: () => void;
  users: User[]; // Danh sách user để chọn
}

const GroupChatModal: React.FC<GroupChatModalProps> = ({ isOpen, onClose, users = [] }) => {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FieldValues>({
    defaultValues: {
      name: '',
      members: []
    }
  });

  const members = watch('members');

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);
    axios.post('/api/conversations', {
      ...data,
      isGroup: true
    })
    .then(() => {
      router.refresh();
      onClose();
    })
    .finally(() => setIsLoading(false));
  }

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) {
    return null; 
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-12">
          <div className="border-b border-gray-900/10 pb-12">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Tạo nhóm chat mới
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Tạo nhóm để chat với nhiều hơn 2 người.
            </p>

            <div className="mt-10 flex flex-col gap-y-8">
              {/* Ô nhập tên nhóm */}
              <div>
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Tên nhóm
                </label>
                <div className="mt-2">
                  <input
                    disabled={isLoading}
                    {...register("name", { required: true })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6 pl-2"
                  />
                </div>
              </div>

              {/* Ô chọn thành viên (Select Multi) */}
              <div>
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Thành viên
                </label>
                <div className="mt-2">
                  <Select
                    isDisabled={isLoading}
                    isMulti
                    options={users.map((user) => ({ 
                      value: user.id, 
                      label: user.username 
                    }))}
                    onChange={(value) => setValue('members', value, { shouldValidate: true })}
                    value={members}
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ 
                        ...base, 
                        zIndex: 9999
                      }) 
                    }}
                    classNames={{
                        control: () => "text-sm"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-x-6">
          <button
            disabled={isLoading}
            onClick={onClose}
            type="button"
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            Hủy
          </button>
          <button
            disabled={isLoading}
            type="submit"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Tạo nhóm
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default GroupChatModal;