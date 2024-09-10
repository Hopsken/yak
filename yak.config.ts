type Config = {
  repo: {
    owner: string
    name: string
  }
  analytics?: {
    umami?: {
      host: string
      websiteId: string
    }
  }
}

const config: Config = {
  repo: {
    owner: 'hopsken',
    name: 'notes'
  },
  analytics: {
    umami:
      process.env.NEXT_PUBLIC_UMAMI_HOST &&
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
        ? {
            host: process.env.NEXT_PUBLIC_UMAMI_HOST,
            websiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
          }
        : undefined
  }
}

export default config
