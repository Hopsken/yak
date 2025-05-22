import { createGitHubReader } from '@keystatic/core/reader/github'
import { createReader as createLocalReader } from '@keystatic/core/reader'

import keystaticConfig from '../../../keystatic.config'
import yak from '../../../yak.config'

const LOCAL_MODE = !!process.env.LOCAL_MODE

export const createReader = () => {
  return LOCAL_MODE
    ? createLocalReader(process.cwd(), keystaticConfig)
    : createGitHubReader(keystaticConfig, {
        repo: `${yak.repo.owner}/${yak.repo.name}`,
        token: process.env.GITHUB_ACCESS_TOKEN
      })
}
