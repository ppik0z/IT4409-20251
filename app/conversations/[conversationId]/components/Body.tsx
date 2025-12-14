"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { pusherClient } from "@/lib/pusher";
import { useUser } from "@clerk/nextjs";

import { FullMessageType } from "@/types";
import useConversation from "@/hooks/useConversation";
import MessageBox from "./MessageBox";
import { CgSpinner } from "react-icons/cg";

interface BodyProps {
  initialMessages: FullMessageType[];
}

const Body: React.FC<BodyProps> = ({ initialMessages = [] }) => {
  const [messages, setMessages] = useState(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { conversationId } = useConversation();
  const { user } = useUser();

// --- LOGIC LOAD MORE ---
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true); 

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;

    setIsLoadingMore(true);
    const oldestMessageId = messages[0].id;

    try {
      const res = await axios.get(`/api/conversations/${conversationId}/messages?cursor=${oldestMessageId}`);
      const newMessages = res.data;

      if (newMessages.length === 0) {
        setHasMore(false); 
      } else {
        setMessages((current) => [...newMessages, ...current]);
      }
    } catch (error) {
      console.log("Lỗi tải thêm tin nhắn", error);
    } finally {
      setIsLoadingMore(false);
    }
  };
// -----------------------


  useEffect(() => {
    axios.post(`/api/conversations/${conversationId}/seen`);
  }, [conversationId]);

  // Lắng nghe sự kiện Optimistic từ Form
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const optimisticHandler = (e: any) => {
      const message = e.detail;
      setMessages((current) => [...current, message]);
      bottomRef?.current?.scrollIntoView();
    };

    window.addEventListener("message:optimistic", optimisticHandler);
    return () => window.removeEventListener("message:optimistic", optimisticHandler);
  }, []);

  // REALTIME 
  useEffect(() => {
    pusherClient.subscribe(conversationId);
    bottomRef?.current?.scrollIntoView();

    const messageHandler = (message: FullMessageType) => {
      axios.post(`/api/conversations/${conversationId}/seen`);

      setMessages((current) => {
        if (current.find((m) => m.id === message.id)) {
          return current;
        }

        if (user && message.sender.email === user.primaryEmailAddress?.emailAddress) {
          const optimisticIndex = current.findIndex((m) => 
            m.id.startsWith("temp_") && (m.body === message.body || m.image === message.image)
          );
          if (optimisticIndex !== -1) {
            const newMessages = [...current];
            newMessages[optimisticIndex] = message;
            return newMessages;
          }
        }

        return [...current, message];
      });
      
      bottomRef?.current?.scrollIntoView();
    };

    pusherClient.bind('messages:new', messageHandler);

    return () => {
      pusherClient.unsubscribe(conversationId);
      pusherClient.unbind('messages:new', messageHandler);
    }
  }, [conversationId, user]);
  // ------------------------------------

  return ( 
    <div className="flex-1 overflow-y-auto bg-slate-100">

      {hasMore && (
        <div className="flex justify-center p-4">
            {isLoadingMore ? (
                <CgSpinner className="animate-spin h-6 w-6 text-gray-500"/>
            ) : (
                <button 
                    onClick={loadMoreMessages}
                    className="text-xs text-gray-500 hover:text-sky-500 transition cursor-pointer underline"
                >
                    Tải tin nhắn cũ hơn
                </button>
            )}
        </div>
      )}

      {messages.map((message, i) => (
        <MessageBox 
          isLast={i === messages.length - 1} 
          key={message.id} 
          data={message} 
        />
      ))}
      <div ref={bottomRef} className="pt-24" />
    </div>
  );
}
 
export default Body;