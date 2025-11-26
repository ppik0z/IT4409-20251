import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { pusherServer } from "@/lib/pusher";

interface IParams {
  conversationId: string;
}

export async function DELETE(
  request: Request,
  props: { params: Promise<IParams> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    const params = await props.params;
    const { conversationId } = params;

    if (!clerkUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Tìm User trong DB
    const currentUser = await prisma.user.findUnique({
        where: { externalId: clerkUserId }
    });

    if (!currentUser) {
        return new NextResponse("Invalid User", { status: 400 });
    }
    
    const myDbId = currentUser.id;

    // 2. Tìm cuộc trò chuyện
    const existingConversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { users: true }
    });

    if (!existingConversation) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    // --- LOGIC PHÂN QUYỀN ---
    const isAdmin = existingConversation.adminIds.includes(myDbId);
    
    // LÀ ADMIN (HOẶC CHAT ĐÔI) -> XÓA CẢ NHÓM
    if (isAdmin || !existingConversation.isGroup) {
        const deletedConversation = await prisma.conversation.deleteMany({
            where: {
                id: conversationId,
                userIds: { hasSome: [myDbId] }
            }
        });

        // Báo cho mọi người biết nhóm đã bị hủy
        existingConversation.users.forEach((user) => {
            if (user.email) {
                pusherServer.trigger(user.email, 'conversation:remove', existingConversation);
            }
        });

        return NextResponse.json(deletedConversation);
    }

    // THƯỜNG -> RỜI NHÓM (DISCONNECT)
    else {
        const leftConversation = await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                users: {
                    disconnect: { id: myDbId }
                }
            },
            include: { users: true }
        });

        // A. Báo cho những người ở lại biết là mình đã đi (Update danh sách thành viên)
        leftConversation.users.forEach((user) => {
            if (user.email) {
                pusherServer.trigger(user.email, 'conversation:update', leftConversation);
            }
        });

        // B. Báo cho chính mình biết để xóa cái nhóm đó khỏi Sidebar của mình
        if (currentUser.email) {
             pusherServer.trigger(currentUser.email, 'conversation:remove', leftConversation);
        }

        return NextResponse.json(leftConversation);
    }

  } catch (error) {
    console.log(error, "CONVERSATION_LEAVE_ERROR");
    return new NextResponse("Error", { status: 500 });
  }
}