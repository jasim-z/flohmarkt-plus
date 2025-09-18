import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // Keep experimental minimal to avoid unstable behavior
  experimental: {
    // Disable features that might cause restart loops
    webpackBuildWorker: false,
  },
  
  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Development sensible defaults; let Next manage HMR/refresh
  ...(process.env.NODE_ENV === 'development' && {
    compiler: {
      removeConsole: false,
    },
    productionBrowserSourceMaps: false,
    // Disable hot reloading in Docker to prevent restarts
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
    // Disable Fast Refresh to prevent restarts
    reactStrictMode: false,
    // Disable experimental features that might cause restarts
    experimental: {
      webpackBuildWorker: false,
    },
  }),
  
  // Server external packages (moved outside development section)
  serverExternalPackages: [],
  
  // Webpack optimizations
  webpack: (config, { dev }) => {
    // Completely disable file watching in Docker
    if (dev) {
      config.watchOptions = {
        poll: false,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/next.config.ts',
          '**/next.config.js',
        ],
      };
    }
    // Keep fallbacks to avoid polyfills for server-only modules on client
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    // Avoid disabling devtool entirely; Next manages this for Fast Refresh
    return config;
  },
  
  // Reduce bundle size
  compress: true,
  poweredByHeader: false,
  
  // Optimize for Docker
  output: 'standalone',
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
