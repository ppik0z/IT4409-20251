"use client";

import useConversation from "@/hooks/useConversation";
import axios from "axios";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPaperAirplane, HiPhoto } from "react-icons/hi2";
import { useUser } from "@clerk/nextjs";
import { useRef } from "react";

const Form = () => {
  const { conversationId } = useConversation();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<FieldValues>({
    defaultValues: { message: '' }
  });

  // --- HÀM TẠO TIN NHẮN GIẢ ---
  const createOptimisticMessage = (body: string | null, fileUrl: string | null, fileType: string, fileName?: string) => {
    if (!user) return;
    const optimisticMessage = {
      // eslint-disable-next-line react-hooks/purity
      id: `temp_${Date.now()}`,
      body: body,
      fileUrl: fileUrl,  
      fileType: fileType, 
      fileName: fileName,
      image: fileType === 'image' ? fileUrl : null, 
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        externalId: user.id,
        username: user.fullName || user.username || "Me",
        email: user.primaryEmailAddress?.emailAddress,
        image: user.imageUrl
      },
      seen: []
    };
    window.dispatchEvent(new CustomEvent("message:optimistic", { detail: optimisticMessage }));
  };

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setValue('message', '', { shouldValidate: true });
    createOptimisticMessage(data.message, null, 'text');
    axios.post('/api/messages', {
      message: data.message,
      fileType: 'text', 
      conversationId: conversationId
    });
  };

  // --- XỬ LÝ CHỌN FILE ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const blobUrl = URL.createObjectURL(file);
    let fileType = 'file';
    if (file.type.startsWith('image/')) fileType = 'image';
    if (file.type.startsWith('video/')) fileType = 'video';
    if (file.name.endsWith('.pdf')) fileType = 'file';

    createOptimisticMessage(null, blobUrl, fileType, file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'chatchoi_preset'); 
      formData.append('resource_type', 'auto'); 

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();

      if (data.secure_url) {
        await axios.post('/api/messages', {
          fileUrl: data.secure_url,
          fileType: fileType, 
          fileName: file.name,
          conversationId: conversationId
        });
      }
    } catch (error) {
      console.error("Upload thất bại:", error);
    }
  };

  return ( 
    <div className="py-3 px-4 bg-white border-t flex items-center gap-2 lg:gap-4 lg:border-t-gray-100 w-full">
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
      />

      <div 
        onClick={() => fileInputRef.current?.click()}
        className="
          p-2 
          rounded-full 
          text-sky-500 
          hover:bg-sky-100 
          transition 
          cursor-pointer
        "
        title="Gửi ảnh/video/file"
      >
        <HiPhoto size={28} />
      </div>

      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="flex items-center gap-2 lg:gap-4 w-full"
      >
        <div className="relative w-full">
          <input
            id="message"
            autoComplete="off"
            {...register("message", { required: false })} 
            placeholder="Viết tin nhắn..."
            className="text-black font-light py-2 px-4 bg-gray-100 w-full rounded-full focus:outline-none focus:ring-2 focus:ring-sky-100 transition"
          />
        </div>
        
        <button 
          type="submit" 
          className="
            p-2 
            rounded-full 
            text-sky-500 
            hover:bg-sky-100 
            transition 
            cursor-pointer
          "
        >
          <HiPaperAirplane size={24} />
        </button>
      </form>
    </div>
  );
}
 
export default Form;