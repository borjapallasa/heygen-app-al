/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'resource2.heygen.ai' },
      { protocol: 'https', hostname: 'files2.heygen.ai' },
      { protocol: 'https', hostname: 'app.heygen.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' }
    ]
  }
};
export default nextConfig;
