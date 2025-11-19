import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    // 1. Lấy Clerk ID
    const { userId: clerkUserId } = await auth();
    const body = await request.json();
    const { userId: otherUserId } = body;

    if (!clerkUserId || !otherUserId) {
      return new NextResponse("Thiếu thông tin", { status: 400 });
    }

    // --- BƯỚC QUAN TRỌNG MỚI THÊM ---
    // Phải tìm xem user hiện tại trong DB có ID là gì
    const currentUser = await prisma.user.findUnique({
      where: {
        externalId: clerkUserId
      }
    });

    if (!currentUser) {
      return new NextResponse("Không tìm thấy user hiện tại", { status: 400 });
    }
    
    const myDbId = currentUser.id; // Đây mới là cái ID dùng để query (ObjectId)
    // --------------------------------

    // 2. Tìm cuộc trò chuyện (Dùng myDbId thay vì clerkUserId)
    const existingConversations = await prisma.conversation.findMany({
      where: {
        OR: [
          {
            userIds: {
              equals: [myDbId, otherUserId]
            }
          },
          {
            userIds: {
              equals: [otherUserId, myDbId]
            }
          }
        ]
      }
    });

    const singleConversation = existingConversations[0];

    if (singleConversation) {
      return NextResponse.json(singleConversation);
    }

    // 3. Tạo mới (Cũng dùng myDbId để connect cho chuẩn)
    const newConversation = await prisma.conversation.create({
      data: {
        users: {
          connect: [
            { id: myDbId },     // Connect bằng ID của MongoDB
            { id: otherUserId } 
          ]
        }
      },
      include: {
        users: true
      }
    });

    return NextResponse.json(newConversation);

  } catch (error) {
    console.log("CONVERSATION_POST_ERROR", error);
    return new NextResponse("Lỗi Server", { status: 500 });
  }
}