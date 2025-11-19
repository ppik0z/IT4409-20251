import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server"; 
import Link from "next/link"; 
import { getCurrentUser } from "../actions/getUser";


export default async function Home() {
  const { userId } = await auth(); 

  const dbUser = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100"> {}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-blue-600">
          ChatChoi👌
        </h1>
        <p className="text-slate-600">Dùng ChatChoi cho chất chơi</p>

        {dbUser && (
          <p className="text-sm text-gray-500">
            Chào con vợ {dbUser.username}
          </p>
        )}

        {userId ? ( 
          // Nếu đã đăng nhập -> Hiện nút User Profile
          <div className="flex flex-col items-center gap-2">
             <p className="text-green-600 font-medium">Đã đăng nhập!</p>
             <UserButton/>
          </div>
        ) : (
          // Nếu chưa đăng nhập -> Hiện nút Login
          <div className="space-x-4">
            <Link href="/sign-in">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Đăng nhập
              </button>
            </Link>
            <Link href="/sign-up">
              <button className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition">
                Đăng ký
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}