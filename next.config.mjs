/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: process.env.YAK_ORIGIN
    ? [new URL(process.env.YAK_ORIGIN).hostname]
    : [],
  serverExternalPackages: ['@atcute/oauth-node-client']
}

export default nextConfig
