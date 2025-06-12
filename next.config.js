import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure Next.js for our healthcare platform
  experimental: {
    // Enable Turbopack for faster builds and development
    turbo: {
      // Specify rules for Turbopack
      rules: {
        // Add any custom webpack rules if needed
      },
      
      // Resolve aliases for Turbopack
      resolveAlias: {
        '@/components': './src/components',
        '@/features': './src/features',
        '@/utils': './src/utils',
        '@/hooks': './src/hooks',
        '@/types': './src/types'
      }
    }
  },

  // Configure the router to handle dynamic routes
  reactStrictMode: true,

  // Enable styled components for styling
  compiler: {
    styledComponents: true,
  },

  // Support path aliases for webpack resolution
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/types': path.resolve(__dirname, './src/types')
    };
    return config;
  },
};

export default nextConfig;
