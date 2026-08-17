/** @type {import('next').NextConfig} */
const isGithubPages =
  process.env.GITHUB_PAGES === 'true' ||
  process.env.GITHUB_ACTIONS === 'true';

const repoName = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}`
  : '/pmos';

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["fs"],
  },
  ...(isGithubPages ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
  basePath: isGithubPages ? repoName : '',
  trailingSlash: true,
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
