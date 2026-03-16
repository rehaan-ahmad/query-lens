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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://localhost:8000;"
          },
        ],
      },
    ]
  },
};

export default nextConfig;
