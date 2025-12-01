import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { message, image, conversationId } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { externalId: userId }
    });

    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }


    const newMessage = await prisma.message.create({
      data: {
        body: message,
        image: image,
        conversation: {
          connect: { id: conversationId }
        },
        sender: {
          connect: { id: currentUser.id }
        },
        seen: {
          connect: { id: currentUser.id } // Người gửi auto seen
        }
      },
      include: {
        seen: true,
        sender: true,
      }
    });

    // Cập nhật lại conversation (sau dùng)
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
            seen: true
          }
        }
      }
    });

    // trigger
    await pusherServer.trigger(conversationId, 'messages:new', newMessage);

    return NextResponse.json(newMessage);

  } catch (error) {
    console.log(error, 'ERROR_MESSAGES');
    return new NextResponse("Error", { status: 500 });
  }
}