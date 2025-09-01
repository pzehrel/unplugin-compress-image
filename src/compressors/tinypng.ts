import { defineCompressor } from '../compressor'

export const tinypng = defineCompressor<'tinypng'>((options) => {
  return {
    name: 'tinypng',
    use: /png|jpe?g|webp|avif$/,
    compress: async (file, _, options) => {
      // TODO: 需要支持多个 API Key 的轮询
      // const keys = (await parseApiKeys(options?.tinypng?.keys))
      // const api = options?.tinypng?.api ?? 'https://api.tinify.com/shrink'

      // const response = await fetch(api, {
      //   method: 'POST',
      //   headers: new Headers({
      //     'Authorization': `Basic ${Buffer.from(`api:${keys[0]}`).toString('base64')}`,
      //     'Content-Type': 'application/octet-stream',
      //   }),
      //   body: file,
      // })

      // return response.arrayBuffer()
      return null
    },

  }
})

export interface TinyPngOptions {
  /**
   * TinyPNG API Endpoint
   * @default 'https://api.tinify.com/shrink'
   */
  api?: string

  /**
   * TinyPNG API Keys
   *
   * - Supports environment variable injection; use `TINYPNG_KEYS` to inject keys
   * @default process.env.TINYPNG_KEYS
   */
  keys?: string | string[] | (() => Promise<string[] | string> | string | string[])
}

// async function parseApiKeys(keys?: TinyPngConfig['keys']): Promise<string[]> {
//   if (typeof keys === 'function') {
//     keys = await keys()
//   }

//   if (typeof keys === 'string') {
//     return [keys]
//   }
//   else if (Array.isArray(keys)) {
//     return keys
//   }

//   return []
// }
