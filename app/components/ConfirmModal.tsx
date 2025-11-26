"use client";

import React, { useCallback, useState } from "react";
import { Dialog } from "@headlessui/react";
import { FiAlertTriangle } from "react-icons/fi"; 
import axios from "axios";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import useConversation from "@/hooks/useConversation";


interface ConfirmModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { conversationId } = useConversation();
  const [isLoading, setIsLoading] = useState(false);

  const onDelete = useCallback(() => {
    setIsLoading(true);

    axios.delete(`/api/conversations/${conversationId}`)
    .then(() => {
      onClose();
      router.push('/conversations'); 
      router.refresh();
    })
    .catch(() => alert("Có lỗi xảy ra!"))
    .finally(() => setIsLoading(false));
  }, [router, conversationId, onClose]);

  return ( 
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
          <FiAlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
            Xóa cuộc trò chuyện
          </Dialog.Title>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Bạn có chắc chắn muốn thực hiện hành động này không?
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <button
          disabled={isLoading}
          type="button"
          className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
          onClick={onDelete}
        >
          Xóa
        </button>
        <button
          disabled={isLoading}
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
          onClick={onClose}
        >
          Hủy
        </button>
      </div>
    </Modal>
  );
}
 
export default ConfirmModal;