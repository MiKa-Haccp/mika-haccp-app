import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/frischetheke', destination: '/metzgerei', permanent: true },
      { source: '/frischetheke/:path*', destination: '/metzgerei/:path*', permanent: true },
    ];
  },
};
module.exports = nextConfig;
