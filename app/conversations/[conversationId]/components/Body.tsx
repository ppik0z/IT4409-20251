"use client";

import axios from "axios";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { pusherClient } from "@/lib/pusher";
import { useUser } from "@clerk/nextjs";

import { FullMessageType } from "@/types";
import useConversation from "@/hooks/useConversation";
import MessageBox from "./MessageBox";
import { HiChevronDown, HiChevronUp, HiMagnifyingGlass } from "react-icons/hi2";
import useSearchModal from "@/hooks/useSearchModal";
import { HiXMark } from "react-icons/hi2";
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


  const searchModal = useSearchModal();

  // ---  LOGIC TÌM KIẾM & ĐIỀU HƯỚNG ---
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Tìm tất cả ID của tin nhắn khớp từ khóa
  const matchIds = useMemo(() => {
    if (!searchModal.searchTerm) return [];
    return messages
          .filter((msg) => msg.body?.toLowerCase().includes(searchModal.searchTerm.toLowerCase()))
          .map((msg) => msg.id)
          .reverse(); 
  }, [messages, searchModal.searchTerm]);

  // Reset index khi từ khóa thay đổi
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchModal.searchTerm]);

  // Hàm cuộn tới tin nhắn đang focus
  const scrollToMatch = (index: number) => {
    const id = matchIds[index];
    if (id) {
      const el = document.getElementById(`message-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
      }
    }
  };

  // Tự động cuộn tới kết quả đầu tiên khi vừa tìm thấy
  useEffect(() => {
    if (searchModal.isOpen && matchIds.length > 0) {
      scrollToMatch(currentMatchIndex);
    }
  }, [matchIds.length, searchModal.isOpen, currentMatchIndex]);

  // Nút xuống (Tin mới hơn)
  const handleNext = () => {
    let newIndex = currentMatchIndex - 1;
    if (newIndex < 0) newIndex = matchIds.length - 1; 
    setCurrentMatchIndex(newIndex);
  };

  // Nút lên (Tin cũ hơn)
  const handlePrev = () => {
    let newIndex = currentMatchIndex + 1;
    if (newIndex >= matchIds.length) newIndex = 0; 
    setCurrentMatchIndex(newIndex);
  };

  // ---  LOGIC CUỘN TIN NHẮN ---
  const lastMessageId = useMemo(() => {
    const len = messages.length;
    return len > 0 ? messages[len - 1].id : null;
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && !searchModal.isOpen) {
      bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lastMessageId, searchModal.isOpen]);

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
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 relative">
      
      {/* SEARCH DRAWER */}
      <div className={`
        absolute top-0 left-0 w-full z-30 transition-all duration-300 ease-in-out transform
        ${searchModal.isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
      `}>
        <div className="bg-white shadow-md border-b px-4 py-3 flex items-center gap-3">
          <div className="relative flex-1">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              value={searchModal.searchTerm}
              onChange={(e) => searchModal.setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500 transition"
              autoFocus={searchModal.isOpen}
            />
          </div>

          {/* CỤM NÚT ĐIỀU HƯỚNG */}
          {searchModal.searchTerm && matchIds.length > 0 && (
             <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                <span className="text-xs text-gray-500 font-medium min-w-[30px] text-center">
                   {currentMatchIndex + 1} / {matchIds.length}
                </span>
                <button onClick={handlePrev} className="p-1 hover:bg-gray-200 rounded text-gray-600">
                   <HiChevronUp size={18} />
                </button>
                <button onClick={handleNext} className="p-1 hover:bg-gray-200 rounded text-gray-600">
                   <HiChevronDown size={18} />
                </button>
             </div>
          )}

          <button onClick={searchModal.onClose} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
            <HiXMark size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div ref={loadMoreRef} className="h-1" />
        {hasMore && (
           <div className="flex justify-center p-4">
              <CgSpinner className={`animate-spin h-6 w-6 text-gray-500 ${isLoadingMore ? 'opacity-100' : 'opacity-0'}`}/>
           </div>
        )}

        {messages.map((message, i) => {
           const isMatch = matchIds.includes(message.id);
           const isFocused = matchIds[currentMatchIndex] === message.id;

           return (
             <MessageBox 
               isLast={i === messages.length - 1} 
               key={message.id} 
               data={message}   
               isFocused={isFocused}
             />
           )
        })}
        
        <div ref={bottomRef} className="pt-2" />
      </div>
    </div>
  );
}

export default Body;