/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return {
      fallback: [
        {
          source: '/',
          destination: '/notes/home'
        }
      ]
    }
  }
}

export default nextConfig
