import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // Enable hot reloading in development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // Enable experimental features for better development experience
  experimental: {
    // Add any valid experimental features here if needed
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
