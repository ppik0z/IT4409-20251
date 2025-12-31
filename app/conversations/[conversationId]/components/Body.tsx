"use client";

import axios from "axios";
import { useEffect, useRef, useState, useCallback } from "react";
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
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const { conversationId } = useConversation();
  const { user } = useUser();

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true); 

  // ---  LOGIC CUỘN TRANG TỰ ĐỘNG ---
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // ---  LOGIC TẢI THÊM TIN NHẮN (INFINITY SCROLL) ---
  const loadMoreMessages = useCallback(async () => {
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
  }, [conversationId, hasMore, isLoadingMore, messages]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreMessages();
        }
      },
      { threshold: 1.0 } 
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMoreMessages, hasMore, isLoadingMore]);


  // ---  XỬ LÝ SEEN & OPTIMISTIC EVENT ---
  useEffect(() => {
    axios.post(`/api/conversations/${conversationId}/seen`);
  }, [conversationId]);

  useEffect(() => {
    const optimisticHandler = (e: CustomEvent<FullMessageType>) => {
      const message = e.detail;
      setMessages((current) => [...current, message]);
    };

    window.addEventListener("message:optimistic", optimisticHandler as EventListener);
    return () => window.removeEventListener("message:optimistic", optimisticHandler as EventListener);
  }, []);

  // ---  REALTIME PUSHER ---
  useEffect(() => {
    pusherClient.subscribe(conversationId);
    
    bottomRef?.current?.scrollIntoView();

    const messageHandler = (message: FullMessageType) => {
      axios.post(`/api/conversations/${conversationId}/seen`);

      setMessages((current) => {
        if (current.find((m) => m.id === message.id)) return current;

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
    };

    pusherClient.bind('messages:new', messageHandler);

    return () => {
      pusherClient.unsubscribe(conversationId);
      pusherClient.unbind('messages:new', messageHandler);
    }
  }, [conversationId, user]);

  return ( 
    <div className="flex-1 overflow-y-auto bg-slate-100">
      {/* Ref để trigger load more */}
      <div ref={loadMoreRef} className="h-1" />

      {hasMore && (
        <div className="flex justify-center p-4">
          <CgSpinner className={`animate-spin h-6 w-6 text-gray-500 ${isLoadingMore ? 'opacity-100' : 'opacity-0'}`}/>
        </div>
      )}

      {messages.map((message, i) => (
        <MessageBox 
          isLast={i === messages.length - 1} 
          key={message.id} 
          data={message} 
        />
      ))}
      
      {/* Ref để cuộn xuống cuối */}
      <div ref={bottomRef} className="pt-2" />
    </div>
  );
}

export default Body;