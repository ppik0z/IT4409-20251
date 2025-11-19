import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

export const getCurrentUser = async () => {
  try {
    // 1. Lấy user đang đăng nhập từ Clerk
    const user = await currentUser();

    if (!user || !user.id || !user.emailAddresses[0].emailAddress) {
      return null;
    }

    // 2. Tìm xem user này đã có trong MongoDB chưa (tìm theo externalId của Clerk)
    const currentUserInDb = await prisma.user.findUnique({
      where: {
        externalId: user.id,
      },
    });

    // 3. Nếu đã có -> Trả về user đó
    if (currentUserInDb) {
      return currentUserInDb;
    }

    // 4. Nếu chưa có -> Tạo mới vào MongoDB
    const newUser = await prisma.user.create({
      data: {
        externalId: user.id,
        email: user.emailAddresses[0].emailAddress,
        username: user.firstName + " " + user.lastName,
        image: user.imageUrl,
      },
    });

    return newUser;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log(error, "GET_CURRENT_USER_ERROR");
    return null;
  }
};