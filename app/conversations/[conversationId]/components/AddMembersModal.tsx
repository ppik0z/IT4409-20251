"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { User, Conversation } from "@prisma/client";
import Select from "react-select"; 
import Modal from "@/app/components/Modal";
//import { toast } from "react-hot-toast"; 

interface AddMembersModalProps {
  isOpen?: boolean;
  onClose: () => void;
  users: User[]; // Tất cả user trong hệ thống
  conversation: Conversation & { users: User[] }; // Nhóm hiện tại
}

const AddMembersModal: React.FC<AddMembersModalProps> = ({ 
    isOpen, onClose, users = [], conversation 
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { handleSubmit, setValue, watch } = useForm<FieldValues>({
    defaultValues: { members: [] }
  });

  const members = watch('members');

  // Lọc ra những người CHƯA ở trong nhóm
  const existingIds = conversation.users.map((u) => u.id);
  const availableUsers = users.filter((u) => !existingIds.includes(u.id));

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);
    // Map từ React Select Value sang mảng ID string
    const memberIds = data.members.map((m: { value: string }) => m.value);

    axios.post(`/api/conversations/${conversation.id}/members`, {
      members: memberIds
    })
    .then(() => {
      router.refresh();
      onClose();
      setValue('members', []); // Reset form
    })
    .catch(() => alert("Có lỗi xảy ra"))
    .finally(() => setIsLoading(false));
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-12">
          <div className="border-b border-gray-900/10 pb-12">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Thêm thành viên
            </h2>
            <div className="mt-10 flex flex-col gap-y-8">
              <Select
                isDisabled={isLoading}
                isMulti
                options={availableUsers.map((user) => ({ 
                  value: user.id, 
                  label: user.username 
                }))}
                onChange={(value) => setValue('members', value)}
                value={members}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                placeholder="Chọn người cần thêm..."
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-x-6">
          <button disabled={isLoading} onClick={onClose} type="button" className="text-sm font-semibold text-gray-900">Hủy</button>
          <button disabled={isLoading} type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            Thêm
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AddMembersModal;