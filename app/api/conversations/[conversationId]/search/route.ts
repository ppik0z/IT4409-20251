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
    const query = searchParams.get("query");

    if (!userId || !conversationId || !query) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId,
        body: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(messages.map((m: { id: string }) => m.id));

  } catch (error) {
    console.log("[SEARCH_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}