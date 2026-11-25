import type { NextConfig } from 'next';
import withPayload from '@payloadcms/next/withPayload';

const nextConfig: NextConfig = {
  transpilePackages: ['@template/auth', '@template/ui'],
};
export default withPayload(nextConfig);
