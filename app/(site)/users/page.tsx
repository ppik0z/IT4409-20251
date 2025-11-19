import getUsers from "@/app/actions/getUsers";
import UserBox from "./components/UserBox";

const Users = async () => {
  const users = await getUsers();

  return (
    <div className="lg:pl-20 h-full">
      <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6 h-full">
        <h2 className="text-2xl font-bold text-neutral-800 py-4">
          Mọi người
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
           {users.map((user) => (
             <UserBox key={user.id} data={user} />
           ))}
        </div>

      </div>
    </div>
  );
}

export default Users;