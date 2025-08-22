import type { ExcludeFalse, Options } from '../types'
import { Buffer } from 'node:buffer'
import { defineCompressor } from './define'

export const tinypngCompressor = defineCompressor(() => {
  return {
    name: 'tinypng',
    test: /\.(?:png|jpe?g|webp|avif)$/,
    compress: async (file, _, options) => {
      if (options?.tinypng === false) {
        return false
      }

      // TODO: 需要支持多个 API Key 的轮询
      const keys = (await parseApiKeys(options?.tinypng?.keys))
      const api = options?.tinypng?.api ?? 'https://api.tinify.com/shrink'

      const response = await fetch(api, {
        method: 'POST',
        headers: new Headers({
          'Authorization': `Basic ${Buffer.from(`api:${keys[0]}`).toString('base64')}`,
          'Content-Type': 'application/octet-stream',
        }),
        body: file,
      })

      return response.arrayBuffer()
    },

  }
})

async function parseApiKeys(keys?: NonNullable<ExcludeFalse<Options>['tinypng']>['keys']): Promise<string[]> {
  if (typeof keys === 'function') {
    keys = await keys()
  }

  if (typeof keys === 'string') {
    return [keys]
  }
  else if (Array.isArray(keys)) {
    return keys
  }

  return []
}
