import type { VitePlugin } from 'unplugin'
import type { Code, Options } from '../types'
import process from 'node:process'
import { CompressLogger } from '../common'
import { compress, initCompressors } from '../compressor'

export function createVitePlugin(options?: Options): Partial<VitePlugin> {
  let root = process.cwd()

  return {
    configResolved(config) {
      root = config.root
      initCompressors(options)
      CompressLogger.createFromOptions(options)
    },
    async generateBundle(_, bundle) {
      const logger = CompressLogger.instance
      const queue: Promise<any>[] = []

      for (const id in bundle) {
        const file = bundle[id]

        queue.push((async () => {
          if (file.type === 'asset' && typeof file.source !== 'string') {
            const result = await compress({ id, source: file.source, options, root })
            if (result.data?.isSmallerThanSourceFile) {
              file.source = result.data?.compressed || file.source
            }
            logger?.add(result)
            return
          }

          if (file.type === 'chunk' || (file.type === 'asset' && typeof file.source === 'string')) {
            const source = (file.type === 'asset' ? file.source : file.code) as Code
            const result = await compress({ id, source, options, root })
            if (result.data?.isSmallerThanSourceFile) {
              const code = result.data.compressed
              file.type === 'chunk' ? (file.code = code) : (file.source = code)
            }
            logger?.add(result)
          }
        })())
      }

      await Promise.all(queue)
    },

    closeBundle() {
      CompressLogger.instance?.printStats(this.environment.logger.info)
    },
  }
}
