import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { pusherServer } from "@/lib/pusher";

interface IParams {
  conversationId: string;
}

export async function POST(
  request: Request,
  props: { params: Promise<IParams> }
) {
  try {
    const { userId: myClerkId } = await auth();
    const params = await props.params;
    const { conversationId } = params;
    const body = await request.json();
    const { action, targetId } = body; 

    if (!myClerkId || !targetId) return new NextResponse("Unauthorized", { status: 401 });

    // Lấy thông tin bản thân 
    const me = await prisma.user.findUnique({ where: { externalId: myClerkId } });
    if (!me) return new NextResponse("Unauthorized", { status: 401 });

    // Lấy thông tin nhóm
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { users: true }
    });

    if (!conversation) return new NextResponse("Invalid ID", { status: 400 });

    // Kiểm tra quyền 
    const amIAdmin = conversation.adminIds.includes(me.id);
    const amIMod = conversation.moderatorIds.includes(me.id);
    
    if (!amIAdmin && !amIMod) return new NextResponse("Không đủ thẩm quyền", { status: 403 });

    // Check quyển của target
    const isTargetAdmin = conversation.adminIds.includes(targetId);
    const isTargetMod = conversation.moderatorIds.includes(targetId);

    // Mod không được động vào Admin hoặc Mod khác
    if (amIMod && (isTargetAdmin || isTargetMod)) {
        return new NextResponse("Không đủ thẩm quyền", { status: 403 });
    }

    // --- XỬ LÝ LỆNH ---
    let updatedConversation;

    if (action === 'kick') {
        updatedConversation = await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                users: { disconnect: { id: targetId } }, 
                moderatorIds: { 
                    set: conversation.moderatorIds.filter((id: string) => id !== targetId)
                }
            },
            include: { users: true }
        });
    } 
    
    else if (action === 'promote' && amIAdmin) { // Chỉ Admin mới được thăng chức
        updatedConversation = await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                moderatorIds: { push: targetId }
            },
            include: { users: true }
        });
    }

    else if (action === 'demote' && amIAdmin) { // Chỉ Admin mới được giáng chức
        updatedConversation = await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                moderatorIds: { 
                    set: conversation.moderatorIds.filter((id: string) => id !== targetId) 
                }
            },
            include: { users: true }
        });
    } else {
        return new NextResponse("Invalid Action", { status: 400 });
    }

    // 4. Bắn Pusher thông báo
    updatedConversation.users.forEach((user: { email: string | string[]; }) => {
      if (user.email) pusherServer.trigger(user.email, 'conversation:update', updatedConversation);
    });

    return NextResponse.json(updatedConversation);

  } catch (error) {
    console.log(error, "MEMBER_MANAGEMENT_ERROR");
    return new NextResponse("Error", { status: 500 });
  }
}