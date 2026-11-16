import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  cacheComponents: true,
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*'],
  transpilePackages: ['@smartapp/ui', '@smartapp/data'],
};

export default nextConfig;
