// app/conversations/[conversationId]/page.tsx

import getConversationById from "@/app/actions/getConversationById";
import Header from "./components/Headers";

interface IParams {
  conversationId: string;
}

// 1. params bây giờ là Promise
const ConversationId = async (props: { params: Promise<IParams> }) => {
  
  // 2. Phải await nó trước khi dùng
  const params = await props.params; 
  
  const conversation = await getConversationById(params.conversationId);

  if (!conversation) {
    return (
      <div className="lg:pl-80 h-full">
        <div className="h-full flex flex-col items-center justify-center text-gray-500">
          Không tìm thấy cuộc trò chuyện.
        </div>
      </div>
    );
  }

  return ( 
    <div className="lg:pl-80 h-full">
      <div className="h-full flex flex-col">
        <Header conversation={conversation} />
        
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4">
           Body (Tin nhắn)
        </div>

        <div className="p-4 border-t bg-white">
           Form (Nhập liệu)
        </div>
      </div>
    </div>
  );
}

export default ConversationId;