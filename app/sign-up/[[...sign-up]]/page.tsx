import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
  return (
    <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Cột Trái: Form Đăng nhập */}
      <div className="flex flex-col items-center justify-center p-8 bg-white">
        <div className="mb-8 text-center md:hidden">
           {/* Logo hiện trên mobile */}
           <h1 className="text-3xl font-bold text-blue-600">ChatChoi</h1>
        </div>
        <SignUp />
        <div className="mt-6 text-sm text-slate-500">
            <Link href="/" className="hover:underline hover:text-blue-600">
              ← Quay lại trang chủ
            </Link>
        </div>
      </div>

      {/* Phải: Review*/}
      <div className="hidden md:flex flex-col justify-between bg-linear-to-br from-blue-600 to-indigo-900 p-12 text-white">
        <div>
          <h1 className="text-4xl font-bold mb-4">ChatChoi👌</h1>
          <p className="text-lg text-blue-100">
            Slogan chất chơi
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
          <p className="italic">
            Founder review
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold">
              D
            </div>
            <div>
              <p className="font-bold">Dang Khai</p>
              <p className="text-xs text-blue-200">Founder ChatChoi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}