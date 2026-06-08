/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Les images (data URL) transitent par des Server Actions ; on relève la limite.
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
