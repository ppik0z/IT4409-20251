import prisma from "@/lib/prismadb";
import { getCurrentUser } from "./getUser";

const getUnreadConversations = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id) {
    return [];
  }

  try {
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
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    // Lọc ra những hội thoại mà tin nhắn cuối cùng mình CHƯA xem
    // Và tin nhắn đó KHÔNG PHẢI do mình gửi
    const unreadConversations = conversations.filter((conversation) => {
      const lastMessage = conversation.messages[0];

      if (!lastMessage) return false;

      // Nếu mình là người gửi
      const isOwn = lastMessage.senderId === currentUser.id;
      if (isOwn) return false;

      // Kiểm tra 'seen' chưa
      const seenIds = lastMessage.seenIds || [];
      return !seenIds.includes(currentUser.id);
    });

    return unreadConversations;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return [];
  }
};

export default getUnreadConversations;