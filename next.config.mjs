/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '127.0.0.1',
    ...(process.env.YAK_DEV_ORIGIN
      ? [new URL(process.env.YAK_DEV_ORIGIN).hostname]
      : [])
  ],
  serverExternalPackages: ['@atcute/oauth-node-client']
}

export default nextConfig
