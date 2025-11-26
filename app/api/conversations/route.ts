import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: Request) {
  
  try {
    const { userId: clerkUserId } = await auth();
    const body = await request.json();
    const { userId: otherUserId, isGroup, members, name } = body;

    if (!clerkUserId || (!otherUserId && !isGroup)) {
      return new NextResponse("Thiếu thông tin", { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: {
        externalId: clerkUserId
      }
    });
  //  console.log("Check:", { isGroup, name, membersLength: members?.length });
    if (!currentUser) {
      return new NextResponse("Không tìm thấy user hiện tại", { status: 400 });
    }
    
    const myDbId = currentUser.id; 



    if (isGroup) {
      if (!members || members.length < 2 || !name) {
        return new NextResponse("Cần ít nhất 2 thành viên và tên nhóm", { status: 400 });
      }


      const newConversation = await prisma.conversation.create({
        data: {
          name,
          isGroup: true,
          adminIds: [myDbId],
          users: {
            connect: [
              ...members.map((member: { value: string }) => ({  
                id: member.value 
              })),
              { id: myDbId } 
            ]
          }
        },
        include: {
          users: true
        }
      });

      
      newConversation.users.forEach((user) => {
        if (user.email) {
          pusherServer.trigger(user.email, 'conversation:new', newConversation);
        }
      });

      return NextResponse.json(newConversation);
    }

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


    const newConversation = await prisma.conversation.create({
      data: {
        users: {
          connect: [
            { id: myDbId },     
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