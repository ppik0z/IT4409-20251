"use client";

import axios from "axios";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { pusherClient } from "@/lib/pusher";
import { useUser } from "@clerk/nextjs";
import { useLayoutEffect } from "react";
import { FullMessageType } from "@/types";
import useConversation from "@/hooks/useConversation";
import MessageBox from "./MessageBox";
import { HiChevronDown, HiChevronUp, HiMagnifyingGlass } from "react-icons/hi2";
import useSearchModal from "@/hooks/useSearchModal";
import { HiXMark } from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import { debounce } from "lodash";

interface BodyProps {
  initialMessages: FullMessageType[];
}

const Body: React.FC<BodyProps> = ({ initialMessages = [] }) => {
  const [messages, setMessages] = useState(initialMessages);

  const bottomRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0); 

  const { conversationId } = useConversation();
  const { user } = useUser();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  


  const searchModal = useSearchModal();

  // ---  LOGIC TÌM KIẾM & ĐIỀU HƯỚNG ---
  const [serverMatchIds, setServerMatchIds] = useState<string[]>([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Debounce
  const searchMessages = useCallback(
    debounce(async (term: string) => {
      if (!term) {
        setServerMatchIds([]);
        return;
      }
      setIsSearchingServer(true);
      try {
        const res = await axios.get(`/api/conversations/${conversationId}/search?query=${term}`);
        setServerMatchIds(res.data); 
        setCurrentMatchIndex(0); 
      } catch (error) {
        console.error("Lỗi tìm kiếm", error);
      } finally {
        setIsSearchingServer(false);
      }
    }, 500), 
    [conversationId]
  );

  useEffect(() => {
    if (searchModal.searchTerm) {
      searchMessages(searchModal.searchTerm);
    } else {
      setServerMatchIds([]);
    }
  }, [searchModal.searchTerm, searchMessages]);

// ---  LOGIC NHẢY ĐẾN TIN NHẮN ---
  const jumpToMessage = async (targetId: string) => {
    //  Kiểm tra xem tin nhắn đã có trong list hiện tại chưa
    const existingMessage = messages.find(m => m.id === targetId);

    if (existingMessage) {
      // Có rồi thì cuộn tới
      const el = document.getElementById(`message-${targetId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Chưa có -> Phải tải thêm từ Server
      setIsLoadingMore(true);
      try {
        const oldestCurrentId = messages[0].id;
        const res = await axios.get(`/api/conversations/${conversationId}/messages?cursor=${oldestCurrentId}&limit=20`); 
        const newMessages = res.data;
        
        if (newMessages.length > 0) {
            setMessages((prev) => [...newMessages, ...prev]);

            setTimeout(() => {
                const el = document.getElementById(`message-${targetId}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                else {
                    console.log("Vẫn chưa load tới tin nhắn đó, cần bấm nút lần nữa hoặc load thêm");
                }
            }, 500);
        }
      } catch (error) {
        console.log("Lỗi jump to message", error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  // --- 3. ĐIỀU HƯỚNG ---
  // Tự động nhảy tới kết quả đầu tiên khi có danh sách search
  useEffect(() => {
    if (searchModal.isOpen && serverMatchIds.length > 0) {
       // Chỉ nhảy nếu chưa focus (optional)
       jumpToMessage(serverMatchIds[currentMatchIndex]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverMatchIds]); // Chỉ chạy khi danh sách ID thay đổi (mới search xong)

  const handleNavigateNewer = () => {
    let newIndex = currentMatchIndex - 1; // Vì mảng server là Mới -> Cũ
    if (newIndex < 0) newIndex = serverMatchIds.length - 1;
    setCurrentMatchIndex(newIndex);
    jumpToMessage(serverMatchIds[newIndex]);
  };

  const handleNavigateOlder = () => {
    let newIndex = currentMatchIndex + 1; // Cũ hơn là index tăng lên
    if (newIndex >= serverMatchIds.length) newIndex = 0;
    setCurrentMatchIndex(newIndex);
    jumpToMessage(serverMatchIds[newIndex]);
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
  }, [lastMessageId]);

  // ---  LOGIC TẢI THÊM TIN NHẮN (INFINITY SCROLL) ---
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;

    if (containerRef.current) {
      prevScrollHeightRef.current = containerRef.current.scrollHeight;
    }

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

  // ---  LOGIC GIỮ VỊ TRÍ CUỘN KHI TẢI TIN CŨ (SCROLL RESTORATION) ---
  useLayoutEffect(() => {
    if (containerRef.current && prevScrollHeightRef.current > 0) {
      const container = containerRef.current;
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - prevScrollHeightRef.current;

      // Nếu chiều cao tăng lên  -> Đẩy thanh cuộn xuống
      if (heightDifference > 0) {
        container.scrollTop = heightDifference;
        prevScrollHeightRef.current = 0;
      }
    }
  }, [messages]); 


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

          {/* CỤM NÚT ĐIỀU HƯỚNG (Sửa lại dùng serverMatchIds) */}
          {searchModal.searchTerm && serverMatchIds.length > 0 && (
             <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                <span className="text-xs text-gray-500 font-medium min-w-[30px] text-center">
                   {/* Hiển thị: Vị trí hiện tại / Tổng số từ Server */}
                   {currentMatchIndex + 1} / {serverMatchIds.length}
                </span>
                
                <button onClick={handleNavigateOlder} className="...">
                   <HiChevronUp size={18} />
                </button>

                <button onClick={handleNavigateNewer} className="...">
                   <HiChevronDown size={18} />
                </button>
             </div>
          )}
          
          {/* Thêm Loading Indicator cho Search */}
          {isSearchingServer && (
              <CgSpinner className="animate-spin text-sky-500 ml-2" />
          )}
        </div>
      </div>

      {/* MESSAGES CONTAINER */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div ref={loadMoreRef} className="h-1" />
        
        {messages.map((message, i) => {
          const isFocused = serverMatchIds[currentMatchIndex] === message.id;
          return (
            <MessageBox 
              isLast={i === messages.length - 1} 
              key={message.id} 
              data={message}   
              isFocused={isFocused}
            />
          );
        })}
        
        <div ref={bottomRef} className="pt-2" />
      </div>
    </div>
  );
}

export default Body;