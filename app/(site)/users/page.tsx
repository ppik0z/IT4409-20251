import getUsers from "@/app/actions/getUsers";
import UserSearch from "./components/UserSearch"; // Import component mới

export const dynamic = "force-dynamic";

const Users = async () => {
  const users = await getUsers();

  return (
    <div className="lg:pl-20 h-full">
      <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6 h-full">
        <h2 className="text-2xl font-bold text-neutral-800 py-4">
          Mọi người
        </h2>
        
        <UserSearch items={users} />
      </div>
    </div>
  );
}

export default Users;