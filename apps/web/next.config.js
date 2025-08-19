/** @type {import('next').NextConfig} */

// Bundle analyzer setup
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // Optimize builds for development branch
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' && process.env.VERCEL_GIT_COMMIT_REF === 'main',
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  eslint: {
    // Disable ESLint during builds for faster deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Only enforce TypeScript errors on main branch
    ignoreBuildErrors: process.env.VERCEL_GIT_COMMIT_REF === 'development',
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
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}

module.exports = withBundleAnalyzer(nextConfig)