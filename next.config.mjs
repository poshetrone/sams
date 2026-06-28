/** @type {import('next').NextConfig} */
const nextConfig = {
  // Génère un serveur autonome (.next/standalone) pour une image Docker minimale.
  output: 'standalone',
  experimental: {
    serverActions: {
      // Les images (data URL) transitent par des Server Actions ; on relève la limite.
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
