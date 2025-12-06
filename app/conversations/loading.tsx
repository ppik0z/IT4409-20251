// File: app/conversations/loading.tsx
export default function Loading() {
  return (
    <div className="h-full p-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-500">Đang tải tin nhắn...</span>
    </div>
  );
}