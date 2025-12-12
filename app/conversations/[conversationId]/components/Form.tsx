"use client";

import useConversation from "@/hooks/useConversation";
import axios from "axios";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPaperAirplane, HiPhoto } from "react-icons/hi2";
import { CldUploadButton, CloudinaryUploadWidgetResults } from "next-cloudinary";
import { useUser } from "@clerk/nextjs";

const Form = () => {
  const { conversationId } = useConversation();
  const { user } = useUser();

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

  // --- XỬ LÝ GỬI TEXT  ---
  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setValue('message', '', { shouldValidate: true });
    createOptimisticMessage(data.message, null, 'text');
    axios.post('/api/messages', {
      message: data.message,
      fileType: 'text', 
      conversationId: conversationId
    });
  };

  // --- XỬ LÝ UPLOAD FILE ---
  const handleUpload = (result: CloudinaryUploadWidgetResults) => {
    const info = result.info;
    if (typeof info === "object" && info !== null && "secure_url" in info) {
      let fileType = 'file';
      if (info.resource_type === 'image') fileType = 'image';
      if (info.resource_type === 'video') fileType = 'video';
      if (info.format === 'pdf' || info.original_filename?.endsWith('.pdf')) {
          fileType = 'file';
      }
      const fileName = `${info.original_filename}.${info.format}`;
      createOptimisticMessage(null, info.secure_url, fileType, fileName);
      axios.post('/api/messages', {
        fileUrl: info.secure_url,
        fileType: fileType, 
        fileName: fileName,
        conversationId: conversationId
      });
    }
  }

  return ( 
    <div className="py-3 px-4 bg-white border-t flex items-center gap-2 lg:gap-4 lg:border-t-gray-100 w-full">
      
      <CldUploadButton 
        options={{ maxFiles: 1, resourceType: "auto" }}
        onSuccess={handleUpload} 
        uploadPreset="chatchoi_preset"
      >
        <div className="p-2 rounded-full text-blue-500 hover:bg-sky-100 transition cursor-pointer">
          <HiPhoto size={24} />
        </div>
      </CldUploadButton>

      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="flex items-center gap-2 lg:gap-4 w-full"
      >
        <div className="relative w-full">
          <input
            id="message"
            autoComplete="off"
            {...register("message", { required: true })}
            placeholder="Viết tin nhắn..."
            className="text-black font-light py-2 px-4 bg-gray-100 w-full rounded-full focus:outline-none"
          />
        </div>
        
        <button 
          type="submit" 
          className="p-2 rounded-full text-blue-500 hover:bg-sky-100 transition cursor-pointer"
        >
          <HiPaperAirplane size={24} />
        </button>
      </form>
    </div>
  );
}
 
export default Form;