import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. Định nghĩa các route được phép vào tự do (Công khai)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/api/uploadthing(.*)' // Nếu sau này dùng upload ảnh
]);

export default clerkMiddleware(async (auth, req) => {
  // 2. Nếu KHÔNG phải route công khai -> Bắt buộc đăng nhập
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};