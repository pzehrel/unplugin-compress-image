import type { Options } from '../types'
import { Buffer } from 'node:buffer'
import { defineCompressor } from './compressor'

export const tinypng = defineCompressor({
  test: /\.(png|jpg|jpeg|webp|avif)$/i,
  compress: async (input, _, config) => {
    // TODO: 需要支持多个 API Key 的轮询
    const keys = (await parseApiKeys(config?.tinypng?.keys))
    const api = config?.tinypng?.api ?? 'https://api.tinify.com/shrink'

    const response = await fetch(api, {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Basic ${Buffer.from(`api:${keys[0]}`).toString('base64')}`,
        'Content-Type': 'application/octet-stream',
      }),
      duplex: 'half',
      body: input,
    })

    return response.body!
  },

})

async function parseApiKeys(keys?: NonNullable<Options['tinypng']>['keys']): Promise<string[]> {
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
