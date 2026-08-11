import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  serverActions: {
    allowedOrigins: ['ramais.newlifefibra.com.br', '*.newlifefibra.com.br', 'localhost:3000', '127.0.0.1:3000'],
  },
};

export default nextConfig;
