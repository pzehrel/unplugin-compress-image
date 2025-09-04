import type { RollupPlugin } from 'unplugin'
import type { Code, Options } from '../types'
import { Context } from '../common'
import { compress } from '../compressor'
import { hasBase64 } from '../utils'

export function createRollupPlugin(options?: Options): Partial<RollupPlugin> {
  return {
    async buildStart() {
      await Context.create({
        root: this.environment.config.root,
        outdir: this.environment.config.build.outDir,
        options,
      })
    },
    async generateBundle(_, bundle) {
      const { logger } = Context
      const queue: Promise<any>[] = []

      for (const id in bundle) {
        const file = bundle[id]

        queue.push((async () => {
          if (file.type === 'asset' && typeof file.source !== 'string') {
            const source = file.source

            const result = await compress(id, source)
            if (result.data?.isSmallerThanSourceFile) {
              file.source = result.data?.compressed
            }
            logger?.add(result)
            return
          }

          // Do not compress base64 assets in code files
          if (options?.base64 === false) {
            return
          }
          if (file.type === 'chunk' || (file.type === 'asset' && typeof file.source === 'string')) {
            const source = (file.type === 'asset' ? file.source : file.code) as Code
            if (!hasBase64(source)) {
              return
            }

            const result = await compress(id, source)
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
      Context.logger?.printStats(this.environment.logger.info)
    },
  }
}
