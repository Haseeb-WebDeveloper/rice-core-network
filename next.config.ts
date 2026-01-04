/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add your Next.js config options here
  // cacheComponents: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Allow up to 10MB for file uploads (payment screenshots)
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig;
