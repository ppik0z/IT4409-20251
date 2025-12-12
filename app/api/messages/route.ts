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
        messages: {
          include: {
            seen: true,
            sender: true,
          }
        }
      }
    });

    // Trigger cho cửa sổ chat
    await pusherServer.trigger(conversationId, 'messages:new', newMessage);

    // Trigger cho Sidebar & Notification
    const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1];

    const minimalUsers = updatedConversation.users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      image: u.image
    }));

    // Tạo message rút gọn
    const minimalMessage = {
      id: lastMessage.id,
      body: lastMessage.body,
      image: lastMessage.image,
      createdAt: lastMessage.createdAt,
      senderId: lastMessage.senderId,
      sender: { 
         id: lastMessage.sender.id,
         username: lastMessage.sender.username
      }
    };

    // Gửi đi cho từng người nhận
    await Promise.all(
      updatedConversation.users.map(async (user) => {
        if (user.email) {
          await pusherServer.trigger(user.email, 'conversation:update', {
            id: conversationId,
            messages: [minimalMessage],
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