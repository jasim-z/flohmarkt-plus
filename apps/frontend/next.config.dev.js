// Static development configuration to prevent restarts
const nextConfig = {
  // Performance optimizations - keep static
  experimental: {
    workerThreads: false,
    cpus: 1,
    optimizePackageImports: ['react-icons', '@radix-ui/react-icons'],
  },
  
  // External packages configuration
  serverExternalPackages: [],
  
  // Disable features that cause restarts
  reactStrictMode: false,
  
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
      
      // Reduce memory usage and improve performance
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
        // Disable source maps in development for better performance
        devtool: false,
      };
      
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

module.exports = nextConfig;
