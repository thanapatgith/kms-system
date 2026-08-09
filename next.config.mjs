/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ป้องกันการทำ static generation บน API routes
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;