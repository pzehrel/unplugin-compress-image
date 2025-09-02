import type { WebpackCompiler } from 'unplugin'
import type { Options } from '../types'
import { Buffer } from 'node:buffer'
import { relative } from 'node:path'
import { CompressLogger } from '../common'
import { compress, initCompressors } from '../compressor'

export function createWebpackPlugin(options: Options | undefined, PKG_NAME: string): (compiler: WebpackCompiler) => void {
  return (compiler) => {
    compiler.hooks.thisCompilation.tap(PKG_NAME, (compilation) => {
      compilation.hooks.processAssets.tapAsync(
        { name: PKG_NAME, stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE },
        async (assets, callback) => {
          const root = compiler.context
          initCompressors(options)
          CompressLogger.createFromOptions(options)

          const queue = Object.entries(assets).map(async ([absolute, asset]) => {
            const id = relative(root, absolute)
            const source = asset.source()
            const result = await compress({ id, source, options, root })
            if (result.data?.isSmallerThanSourceFile) {
              const buffer = Buffer.from(result.data.compressed)
              compilation.updateAsset(absolute, new compiler.webpack.sources.RawSource(buffer))
            }
            CompressLogger.instance?.add(result)
          })

          await Promise.all(queue)

          callback()
        },
      )
    })

    compiler.hooks.done.tap(PKG_NAME, () => {
      const logger = compiler.getInfrastructureLogger(PKG_NAME)
      CompressLogger.instance?.printStats(logger.info.bind(logger))
    })
  }
}
