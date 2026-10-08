/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  distDir: ".e621-app",
  staticPageGenerationTimeout: 120,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        child_process: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
}

module.exports = nextConfig
