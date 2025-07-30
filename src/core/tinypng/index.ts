import type { Compressor } from '../compressor'
import { Buffer } from 'node:buffer'

export const tinypng: Compressor = {
  name: 'tinypng',
  // test: /\.png$/i,
  compress: async (input, config) => {
    const apiKeys = config.tinypng?.keys
    if (!apiKeys || apiKeys.length === 0) {
      throw new Error('TinyPNG API keys are not configured.')
    }

    // TODO: 需要支持多个 API Key 的轮询
    const key = Array.isArray(apiKeys) ? apiKeys[0] : apiKeys

    const response = await fetch('https://api.tinify.com/shrink', {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Basic ${Buffer.from(`api:${key}`).toString('base64')}`,
        'Content-Type': 'application/octet-stream',
      }),
      duplex: 'half',
      body: input.file,
    })

    return response.arrayBuffer()
  },

}
