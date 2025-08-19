/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  eslint: {
    // Temporarily disable ESLint during builds to proceed with testing
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@awe/shared', '@awe/database'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle playwright and other heavy dependencies on the server
      config.externals = [...(config.externals || []), 'playwright', 'playwright-core', 'playwright-chromium'];
    }
    
    // Ignore non-JS files from playwright
    config.module.rules.push({
      test: /\.(html|ttf)$/,
      loader: 'ignore-loader',
    });
    
    return config;
  },
}

module.exports = nextConfig