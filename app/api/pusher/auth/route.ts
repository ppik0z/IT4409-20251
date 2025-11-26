import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const body = await request.formData(); // Pusher client gửi dạng formData

    // Lấy socket_id và channel_name từ body gửi lên
    const socketId = body.get("socket_id") as string;
    const channel = body.get("channel_name") as string;
    
    if (!userId || !socketId || !channel) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Chúng ta lấy thông tin user từ Clerk (hoặc DB) để gắn vào user_info
    // Ở đây chị dùng Clerk ID làm user_id, và lấy thêm email để định danh
    const data = {
      user_id: userId, // Đây là cái ID sẽ hiện trong danh sách members
      user_info: { // Thông tin đính kèm (tùy chọn)
        // Em có thể thêm email hoặc name vào đây nếu thích
      }
    };

    // Tạo chữ ký xác thực
    const authResponse = pusherServer.authorizeChannel(socketId, channel, data);

    return NextResponse.json(authResponse);
  } catch (error) {
    console.log("PUSHER_AUTH_ERROR", error);
    return new NextResponse("Error", { status: 500 });
  }
}