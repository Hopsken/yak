/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return {
      fallback: [
        {
          source: '/:path*',
          destination: '/notes/home'
        }
      ]
    }
  }
}

export default nextConfig
