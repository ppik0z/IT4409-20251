import { useEffect } from "react";
import { Members } from "pusher-js";
import { pusherClient } from "@/lib/pusher";
import useActiveList from "./useActiveList";

const useActiveChannel = () => {
  const { set, add, remove } = useActiveList();

  useEffect(() => {
    const channel = pusherClient.subscribe('presence-messenger');

    channel.bind('pusher:subscription_succeeded', (members: Members) => {
      const initialMembers: string[] = [];

      members.each((member: { id: string }) => initialMembers.push(member.id));
      set(initialMembers);
    });


    channel.bind('pusher:member_added', (member: { id: string }) => {
      add(member.id);
    });


    channel.bind('pusher:member_removed', (member: { id: string }) => {
      remove(member.id);
    });

    return () => {
      if (channel) {
        pusherClient.unsubscribe('presence-messenger');
        channel.unbind_all();
      }
    }
  }, [set, add, remove]);
}

export default useActiveChannel;