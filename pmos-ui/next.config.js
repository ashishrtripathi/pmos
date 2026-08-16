/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["fs"],
  },
  ...(isGithubPages ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
  basePath: isGithubPages ? '/pmos' : '',
  assetPrefix: isGithubPages ? '/pmos/' : '',
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
