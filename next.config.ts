import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY,
  },
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  /* config options here */
};

export default nextConfig;
