import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

export const getCurrentUser = async () => {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser || !clerkUser.id || !clerkUser.emailAddresses?.[0]?.emailAddress) {
      return null;
    }

    const prismaUser = await prisma.user.upsert({
      where: {
        externalId: clerkUser.id,
      },
      update: {
        // Cập nhật
        username: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}` : "Người dùng",
        image: clerkUser.imageUrl,
        email: clerkUser.emailAddresses[0].emailAddress,
      },
      create: {
        // Tạo mới
        externalId: clerkUser.id,
        username: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}` : "Người dùng",
        image: clerkUser.imageUrl,
        email: clerkUser.emailAddresses[0].emailAddress,
      },
    });

    return prismaUser;
  } catch (error) {
    console.log(error, "GET_CURRENT_USER_ERROR");
    return null;
  }
};