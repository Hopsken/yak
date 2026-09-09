type Config = {
  analytics?: {
    umami?: {
      host: string
      websiteId: string
    }
  }

  links?: Array<{ href: string; text: string }>
}

const config: Config = {
  analytics: {
    umami:
      process.env.NEXT_PUBLIC_UMAMI_HOST &&
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
        ? {
            host: process.env.NEXT_PUBLIC_UMAMI_HOST,
            websiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
          }
        : undefined
  },
  links: [
    {
      href: '/admin',
      text: 'Write'
    }
  ]
}

export default config
