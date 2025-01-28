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
};

export default nextConfig;
