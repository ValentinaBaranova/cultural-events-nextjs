import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    async redirects() {
        return [
            {
                source: '/',
                destination: '/events',
                permanent: true, // Указывает, что редирект постоянный (301)
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: '/events/:id/image',
                destination: 'http://localhost:8080/api/events/:id/image',
            },
        ];
    },
};

export default nextConfig;
