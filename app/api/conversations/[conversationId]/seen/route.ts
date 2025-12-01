import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

interface IParams {
  conversationId: string;
}

export async function POST(
  request: Request,
  props: { params: Promise<IParams> }
) {
  try {
    const { userId } = await auth();
    const params = await props.params; 
    const { conversationId } = params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }


    const currentUser = await prisma.user.findUnique({
      where: { externalId: userId }
    });

    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }


    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        messages: {
          include: {
            seen: true
          }
        },
        users: true,
      },
    });

    if (!conversation) {
      return new NextResponse("Invalid ID", { status: 400 });
    }


    const lastMessage = conversation.messages[conversation.messages.length - 1];

    if (!lastMessage) {
      return NextResponse.json(conversation);
    }


    const isSeen = lastMessage.seenIds.indexOf(currentUser.id) !== -1;

    if (isSeen) {
      return NextResponse.json(conversation);
    }


    await prisma.message.update({
      where: {
        id: lastMessage.id
      },
      data: {
        seen: {
          connect: {
            id: currentUser.id
          }
        }
      }
    });

    return NextResponse.json("Updated");

  } catch (error) {
    console.log(error, 'ERROR_MESSAGES_SEEN');
    return new NextResponse("Error", { status: 500 });
  }
}