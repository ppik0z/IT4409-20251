import getConversationById from "@/app/actions/getConversationById";
import getMessages from "@/app/actions/getMessages"; 
import Header from "./components/Header";
import Body from "./components/Body";  
import Form from "./components/Form";  
import getUsers from "@/app/actions/getUsers";

interface IParams {
  conversationId: string;
}

const ConversationId = async (props: { params: Promise<IParams> }) => {
  const params = await props.params; 
  const users = await getUsers();
  
  // 1. Lấy thông tin cuộc trò chuyện
  const conversation = await getConversationById(params.conversationId);
  
  // 2. Lấy danh sách tin nhắn cũ
  const messages = await getMessages(params.conversationId);

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
        {/* Header: Thông tin người chat cùng */}
        <Header conversation={conversation} users={users} />
        
        {/* Body: Hiển thị danh sách tin nhắn */}
        <Body initialMessages={messages} />

        {/* Form: Ô nhập tin nhắn */}
        <Form />
      </div>
    </div>
  );
}

export default ConversationId;