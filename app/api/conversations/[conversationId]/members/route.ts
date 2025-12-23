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
    const { members } = body; // Danh sách ID người mới muốn thêm

    if (!myClerkId || !members || members.length === 0) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Lấy thông tin bản thân
    const me = await prisma.user.findUnique({ where: { externalId: myClerkId } });
    if (!me) return new NextResponse("Unauthorized", { status: 401 });

    // 2. Lấy thông tin nhóm
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { users: true }
    });

    if (!conversation) return new NextResponse("Invalid ID", { status: 400 });

    // 3. Kiểm tra quyền lực (Chỉ Admin hoặc Mod mới được thêm)
    const isAuthorized = conversation.adminIds.includes(me.id) || conversation.moderatorIds.includes(me.id);
    
    if (!isAuthorized) {
        return new NextResponse("Không đủ thẩm quyền", { status: 403 });
    }

    // 4. Thêm người mới vào nhóm
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        users: {
          connect: members.map((id: string) => ({ id: id }))
        }
      },
      include: {
        users: true
      }
    });

    // 5. Bắn Pusher
    // A. Báo cho người cũ biết (Update danh sách)
    updatedConversation.users.forEach((user) => {
      if (user.email) {
        pusherServer.trigger(user.email, 'conversation:update', updatedConversation);
      }
    });

    // B. Báo cho NGƯỜI MỚI biết (Để nhóm hiện lên Sidebar của họ)
    // Lọc ra những user mới được thêm vào
    const newMemberIds = members; 
    const newMembers = updatedConversation.users.filter((user) => newMemberIds.includes(user.id));

    newMembers.forEach((user) => {
        if (user.email) {
            pusherServer.trigger(user.email, 'conversation:new', updatedConversation);
        }
    });

    return NextResponse.json(updatedConversation);

  } catch (error) {
    console.log(error, "ADD_MEMBER_ERROR");
    return new NextResponse("Error", { status: 500 });
  }
}