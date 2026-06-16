/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || "https://server.orbis-3td.com.br"

const nextConfig = {
  env: {
    API_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || API_URL,
  },
};

export default nextConfig;
