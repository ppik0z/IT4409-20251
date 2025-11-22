"use client";

import useConversation from "@/hooks/useConversation";
import axios from "axios";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPaperAirplane, HiPhoto } from "react-icons/hi2";

const Form = () => {
  const { conversationId } = useConversation();

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
    setValue('message', '', { shouldValidate: true }); // Xóa ô nhập sau khi gửi
    
    axios.post('/api/messages', {
      ...data,
      conversationId: conversationId
    })
  };

  return ( 
    <div className="py-4 px-4 bg-white border-t flex items-center gap-2 lg:gap-4 w-full">
      <HiPhoto size={30} className="text-blue-500 cursor-pointer hover:text-blue-600"/>
      
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="flex items-center gap-2 lg:gap-4 w-full"
      >
        <div className="relative w-full">
          <input
            id="message"
            autoComplete="off"
            {...register("message", { required: true })}
            placeholder="Nhập tin nhắn..."
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