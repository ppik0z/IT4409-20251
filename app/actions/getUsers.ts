import prisma from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

const getUsers = async () => {
  const { userId } = await auth(); 

  if (!userId) {
    return [];
  }

  try {
    // Tìm tất cả user, ngoại trừ bản thân mình
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      where: {
        NOT: {
          externalId: userId
        }
      }
    });

    return users;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  } catch (error: any) {
    return [];
  }
};

export default getUsers;