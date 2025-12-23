import prisma from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

const getConversations = async () => {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  try {
    const currentUser = await prisma.user.findUnique({
        where: { externalId: userId }
    });
    
    if (!currentUser) return [];


    const conversations = await prisma.conversation.findMany({
      orderBy: {
        lastMessageAt: 'desc', 
      },
      where: {
        userIds: {
          has: currentUser.id
        }
      },
      include: {
        users: true, 
        messages: {
          include: {
            sender: true,
            seen: true,
          }
        },
      }
    });

    return conversations;
  } catch (error) {
    console.log("GET_CONVERSATIONS_ERROR", error);
    return [];
  }
};

export default getConversations;