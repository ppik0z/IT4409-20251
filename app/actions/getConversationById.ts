import prisma from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

const getConversationById = async (conversationId: string) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId
      },
      include: {
        users: true
      }
    });

    return conversation;

  } catch (error) {
    console.log("SERVER_ERROR", error);
    return null;
  }
};

export default getConversationById;


// Tìm cuộc trò chuyện dựa trên ID và gồm luôn cả thông tin của 2 người trong đó