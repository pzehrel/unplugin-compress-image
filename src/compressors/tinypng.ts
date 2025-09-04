import process from 'node:process'
import tinify from 'tinify'
import { defineCompressor } from '../compressor'

export const tinypng = defineCompressor('tinypng', () => {
  let keys: string[] = []
  let currentKeyIndex = 0

  return {
    use: (fileType) => {
      if (keys.length === 0) {
        return false
      }
      return /png|jpe?g|webp|avif$/.test(fileType.ext)
    },

    init: async (ctx) => {
      keys = await getKeys(ctx.options?.tinypng?.keys) || []

      if (ctx.options?.tinypng?.proxy) {
        tinify.proxy = ctx.options?.tinypng?.proxy
      }
    },

    compress: async (file) => {
      const task = (): Promise<Uint8Array> => new Promise((resolve, reject) => {
        const key = keys[currentKeyIndex]
        if (!key) {
          return reject(new Error('No TinyPNG API key available'))
        }

        tinify.fromBuffer(file).toBuffer((err, result) => {
          if (err) {
            const nextKeyIndex = (currentKeyIndex + 1)

            // Maybe the remaining number of keys is 0
            if (err instanceof tinify.AccountError && nextKeyIndex <= keys.length) {
              currentKeyIndex = nextKeyIndex
              return task()
            }

            return reject(err)
          }

          if (!result) {
            reject(new Error('No result from TinyPNG'))
            return
          }
          resolve(result)
        })
      })

      return task()
    },

  }
})

export interface TinyPngOptions {
  /**
   * TinyPNG API Keys
   *
   * - Supports environment variable injection; use `TINYPNG_KEYS` to inject keys. Multiple keys can be separated by commas.
   * @default process.env.TINYPNG_KEYS
   */
  keys?: string | string[] | (() => Promise<string[] | string> | string | string[])

  proxy?: string
}

async function getKeys(keys?: TinyPngOptions['keys'] | null): Promise<string[] | null> {
  if (typeof keys === 'string') {
    keys = keys.split(',')
  }

  if (Array.isArray(keys)) {
    keys = keys.map(i => i.trim()).filter(Boolean)
  }

  if (typeof keys === 'function') {
    keys = await getKeys(await keys())
  }

  if (!keys?.length) {
    keys = null
  }

  if (!keys && process.env.TINYPNG_KEYS) {
    const keys = process.env.TINYPNG_KEYS.split(',').map(i => i.trim()).filter(Boolean)
    if (keys.length) {
      return keys
    }
  }

  return null
}
