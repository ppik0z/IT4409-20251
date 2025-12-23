"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { useUser } from "@clerk/nextjs";

interface ActiveCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  isOpen,
  onClose,
  conversationId,
}) => {
  useUser();
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!isOpen || !conversationId) return;

    (async () => {
      try {
        const resp = await fetch(`/api/livekit?room=${conversationId}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [isOpen, conversationId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-[95vw] h-[95vh] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col border border-gray-200">
        {token === "" ? (
          <div className="flex h-full w-full items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Đang kết nối...</p>
            </div>
          </div>
        ) : (
          <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            connect={true}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            data-lk-theme="default"
            className="flex-1 h-full w-full bg-white"
            onDisconnected={onClose}
          >
            <VideoConference />

            <style jsx global>{`
              /* --- ẨN NÚT CHAT BẰNG CSS --- */
              .lk-chat-toggle {
                display: none !important;
              }
              
              /* --- GLOBAL LIGHT THEME --- */
              .lk-video-conference {
                background-color: #ffffff !important;
              }
              .lk-grid-layout {
                background-color: #f9fafb !important;
              }
              .lk-focus-layout-wrapper {
                 background-color: #ffffff !important;
              }

              /* --- BUTTON STYLING (Blue-500) --- */
              .lk-button {
                background-color: #3b82f6 !important;
                color: #e5e7eb !important;
                border: none !important;
                transition: all 0.3s ease !important;
              }
              .lk-button:hover {
                background-color: #2563eb !important;
                color: #ffffff !important;
              }
              
              /* Nút tắt máy (Màu đỏ) */
              .lk-disconnect-button {
                background-color: #ef4444 !important;
                color: white !important;
              }
              .lk-disconnect-button:hover {
                background-color: #dc2626 !important;
              }
            `}</style>
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
};

export default ActiveCallModal;





