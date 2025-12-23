import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    // Lấy room (conversationId) từ query param
    const { searchParams } = new URL(request.url);
    const room = searchParams.get("room");

    if (!userId || !room) {
      return new NextResponse("Missing params", { status: 400 });
    }

    // Lấy tên user để hiện trong cuộc gọi
    const user = await prisma.user.findUnique({
        where: { externalId: userId }
    });

    if (!user) {
        return new NextResponse("User not found", { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return new NextResponse("Server misconfigured", { status: 500 });
    }

    // Tạo Token
    const at = new AccessToken(apiKey, apiSecret, { identity: user.username || "User" });
    
    // Cấp quyền vào phòng
    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

    return NextResponse.json({ token: await at.toJwt() });

  } catch (error) {
    console.log("LIVEKIT_ERROR", error);
    return new NextResponse("Error", { status: 500 });
  }
}