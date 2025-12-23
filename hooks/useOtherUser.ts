import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";
import { User } from "@prisma/client";
import { FullConversationType } from "@/types";

const useOtherUser = (conversation: FullConversationType | { users: User[] }) => {
  const { user } = useUser();

  const otherUser = useMemo(() => {
    const currentUserEmail = user?.emailAddresses[0]?.emailAddress;

    const otherUser = conversation.users.filter((u) => u.email !== currentUserEmail);

    return otherUser[0];
  }, [user?.emailAddresses, conversation.users]);

  return otherUser;
};

export default useOtherUser;




// hàm này để FE phân biệt ai là đối phương, ai là bản thân