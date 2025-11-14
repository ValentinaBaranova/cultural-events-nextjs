import type { NextConfig } from "next";

// Align API base URL with app/lib/config.ts resolution
const API_URL = process.env.NEXT_PUBLIC_EVENTS_API_URL || process.env.EVENTS_API_URL || 'http://localhost:8080/api';

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
                destination: `${API_URL}/events/:id/image`,
            },
        ];
    },
};

export default nextConfig;
