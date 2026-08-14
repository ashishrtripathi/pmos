/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["fs"],
  },
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.GITHUB_PAGES ? '/pmos' : '',
  assetPrefix: process.env.GITHUB_PAGES ? '/pmos/' : '',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // For static export, fs is not available in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
