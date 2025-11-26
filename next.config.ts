import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com', // Cho phép ảnh từ Clerk
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Cho phép ảnh mẫu (nếu dùng)
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Cho phép ảnh Avatar Google
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Cho phép ảnh từ Cloudinary
      }
    ]
  }
};

export default nextConfig;