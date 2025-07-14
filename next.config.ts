import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude backend folder from Next.js compilation
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Exclude backend directory from webpack processing
    config.module.rules.push({
      test: /\.(js|ts|tsx)$/,
      exclude: /backend/,
    });
    
    return config;
  },
};

export default nextConfig;
