import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { userId } = await auth();
    const { conversationId } = await params;

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor"); 
    const limit = 20;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!conversationId) {
        return new NextResponse("Conversation ID Required", { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId,
      },
      take: limit,
      skip: cursor ? 1 : 0, 
      cursor: cursor ? { id: cursor } : undefined, 
      orderBy: {
        createdAt: 'desc', 
      },
      include: {
        sender: true,
        seen: true,
      }
    });

    return NextResponse.json(messages.reverse()); 
  } catch (error) {
    console.log("[MESSAGES_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}