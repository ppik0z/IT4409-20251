import prisma from "@/lib/prismadb";

const getMessages = async (conversationId: string) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId
      },
      include: {
        sender: true, 
        seen: true,  
      },
      orderBy: {
        createdAt: 'desc' 
      },
      take: 25
    });

    return messages.reverse();

  } catch (error) {
    console.log("[GET_MESSAGES_ERROR]", error);
    return [];
  }
};

export default getMessages;