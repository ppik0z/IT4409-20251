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
    formState: {
      errors,
    }
  } = useForm<FieldValues>({
    defaultValues: {
      message: ''
    }
  });

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setValue('message', '', { shouldValidate: true });
    
    // Optimistic UI: Tạo tin nhắn giả và hiển thị ngay
    if (user) {
      const optimisticMessage = {
        // eslint-disable-next-line react-hooks/purity
        id: `temp_${Date.now()}`, // ID tạm thời
        body: data.message,
        image: null,
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
    }

    axios.post('/api/messages', {
      ...data,
      conversationId: conversationId
    })
  };


  const handleUpload = (result: CloudinaryUploadWidgetResults) => {

    const info = result.info;

    if (typeof info === "object" && info !== null && "secure_url" in info) {
      // Optimistic UI cho ảnh
      if (user) {
        const optimisticMessage = {
          id: `temp_${Date.now()}`,
          body: null,
          image: info.secure_url,
          fileName: `${info.original_filename}.${info.format}`,
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
      }

      axios.post('/api/messages', {
        image: info.secure_url, 
        fileName: `${info.original_filename}.${info.format}`,
        conversationId: conversationId
      })
    }
  }

  return ( 
    <div className="py-4 px-4 bg-white border-t flex items-center gap-2 lg:gap-4 lg:border-t-gray-100 w-full">
      

      <CldUploadButton 
        options={{ maxFiles: 1, resourceType: "auto" }}
        onSuccess={handleUpload} 
        uploadPreset="chatchoi_preset"
      >
        <HiPhoto size={30} className="text-blue-500 cursor-pointer hover:text-blue-600"/>
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
            className="text-black font-light py-2 px-4 bg-neutral-100 w-full rounded-full focus:outline-none"
          />
        </div>
        
        <button 
          type="submit" 
          className="rounded-full p-2 bg-blue-500 cursor-pointer hover:bg-blue-600 transition"
        >
          <HiPaperAirplane size={18} className="text-white" />
        </button>
      </form>
    </div>
  );
}
 
export default Form;