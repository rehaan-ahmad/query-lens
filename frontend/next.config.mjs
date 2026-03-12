/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['animejs'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      animejs: 'animejs/lib/anime.es.js',
    };
    return config;
  },
};

export default nextConfig;
