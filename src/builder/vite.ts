import type { VitePlugin } from 'unplugin'
import type { Options } from '../types'
import process from 'node:process'
import { CompressLogger } from '../common'
import { compress } from '../compressor'

export function createVitePlugin(options?: Options): Partial<VitePlugin> {
  const logger = options?.logger === false ? undefined : new CompressLogger()

  let root = process.cwd()

  return {
    configResolved(config) {
      root = config.root
    },
    async generateBundle(_, bundle) {
      const queue: Promise<any>[] = []

      for (const file of Object.values(bundle)) {
        // asset file or chunk file(code)
        if ((file.type === 'asset' && typeof file.source !== 'string') || (file.type === 'chunk' && typeof file.code === 'string')) {
          const id = file.fileName
          const source = file.type === 'asset' ? file.source : file.code
          const promise = compress({ id, source, options, logger, root })
          promise.then((result) => {
            if (result.data && result.rate < 1) {
              if (file.type === 'chunk') {
                file.code = result.data.toString()
              }
              else if (file.type === 'asset') {
                file.source = result.data
              }
            }
          })
          queue.push(promise)
        }
      }

      await Promise.all(queue)
    },

    closeBundle() {
      //
    },
  }
}
