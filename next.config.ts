
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.notebookcheck.net', // Kept for existing images if any, can be removed if all images are local/icons
        port: '',
        pathname: '/**',
      },
      // placehold.co removed as placeholders are replaced by icons
    ],
  },
};

export default nextConfig;
