// Static development configuration to prevent restarts
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  // Performance optimizations - keep static
  experimental: {
    workerThreads: false,
  },
  
  // External packages configuration
  serverExternalPackages: [],
  
  // Disable features that cause restarts
  reactStrictMode: false,
  
  // Chunk loading configuration
  generateEtags: false,
  poweredByHeader: false,
  
  // Development optimizations
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Development optimizations - keep static to prevent restarts
  compiler: {
    removeConsole: false,
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
      {
        protocol: 'https',
        hostname: 'flohmarkt-uploads-bucket.s3.eu-central-1.amazonaws.com',
        port: '',
        pathname: '/**',
      }
    ],
    domains: [
      'localhost',
      '127.0.0.1',
      'example.com',
      'images.unsplash.com',
      'picsum.photos',
      'via.placeholder.com',
      'placehold.co',
      'imgur.com',
      'i.imgur.com',
      'cloudinary.com',
      'res.cloudinary.com',
      'amazonaws.com',
      's3.amazonaws.com',
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Optimize file watching for Docker - disable polling
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 1000,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/dist/**',
          '**/coverage/**',
          '**/.turbo/**',
          '**/logs/**',
          '**/tmp/**',
          '**/*.log',
          '**/.*',
          '**/package-lock.json',
          '**/yarn.lock',
          '**/pnpm-lock.yaml',
          '**/Dockerfile*',
          '**/.dockerignore',
          '**/.env*',
          '**/README.md',
          '**/CHANGELOG.md',
          '**/LICENSE',
          '**/next.config.ts',
          '**/next.config.js',
          '**/next.config.mjs',
        ],
      };
      
      // Simplified chunk splitting for development
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
          },
        },
      };

      // Enable source maps for better debugging
      config.devtool = 'eval-cheap-module-source-map';

      // Reduce bundle analysis overhead
      config.stats = 'minimal';
    }
    
    // General webpack optimizations
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  
  // Reduce bundle size
  compress: true,
  poweredByHeader: false,
  
  // Optimize for Docker
  output: 'standalone',
};

module.exports = withNextIntl(nextConfig);
