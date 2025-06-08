import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'firebasestorage.googleapis.com',
    ],
  },
  // 你其他的 config options 可放這裡
};

export default nextConfig;
