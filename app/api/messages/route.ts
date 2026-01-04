import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { message, fileUrl, fileType, conversationId, fileName } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { externalId: userId }
    });

    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let finalFileType = fileType || 'text';

    // Nếu client cũ gửi 'image' (field cũ) mà không gửi fileType
    if (body.image && !fileUrl) {
        finalFileType = 'image';
    }

    const newMessage = await prisma.message.create({
      data: {
        body: message,
        fileUrl: fileUrl || body.image, 
        fileType: finalFileType,
        fileName: fileName,
        image: finalFileType === 'image' ? (fileUrl || body.image) : null,
        conversation: { connect: { id: conversationId } },
        sender: { connect: { id: currentUser.id } },
        seen: { connect: { id: currentUser.id } }
      },
      include: {
        seen: true,
        sender: true,
      }
    });

    // Cập nhật conversation 
    const updatedConversation = await prisma.conversation.update({
      where: {
        id: conversationId
      },
      data: {
        lastMessageAt: new Date(),
        messages: {
          connect: {
            id: newMessage.id
          }
        }
      },
      include: {
        users: true, 
      }
    });

    const pusherPayload = {
        id: newMessage.id,
        body: newMessage.body,
        image: newMessage.image,
        fileUrl: newMessage.fileUrl,
        fileType: newMessage.fileType,
        fileName: newMessage.fileName,
        createdAt: newMessage.createdAt,
        senderId: newMessage.senderId,
        sender: {
            id: newMessage.sender.id,
            username: newMessage.sender.username,
            image: newMessage.sender.image,
            email: newMessage.sender.email,
        },
        seen: newMessage.seen
    };

    // Trigger cho cửa sổ chat
    await pusherServer.trigger(conversationId, 'messages:new', pusherPayload);

    // Trigger cho Sidebar & Notification
    const lastMessage = newMessage;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const minimalUsers = updatedConversation.users.map((u: { id: any; username: any; email: any; image: any; externalId: any; }) => ({
      id: u.id,
      externalId: String(u.externalId),
      username: u.username,
      email: u.email,
      image: u.image,
    }));

    // Gửi đi cho từng người nhận
    await Promise.all(
      updatedConversation.users.map(async (user: { email: string | string[]; }) => {
        if (user.email) {
          await pusherServer.trigger(user.email, 'conversation:update', {
            id: conversationId,
            messages: [lastMessage],
            lastMessageAt: updatedConversation.lastMessageAt,
            name: updatedConversation.name,
            isGroup: updatedConversation.isGroup,
            users: minimalUsers,
          });
        }
      })
    );

    return NextResponse.json(newMessage);

  } catch (error) {
    console.log(error, 'ERROR_MESSAGES');
    return new NextResponse("Error", { status: 500 });
  }
}