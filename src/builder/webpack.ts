import type { WebpackCompiler } from 'unplugin'
import type { Options } from '../types'
import { Buffer } from 'node:buffer'
import { relative } from 'node:path'
import { Context } from '../common'
import { compress } from '../compressor'

export function createWebpackPlugin(options: Options | undefined, PKG_NAME: string): (compiler: WebpackCompiler) => void {
  return (compiler) => {
    compiler.hooks.thisCompilation.tap(PKG_NAME, (compilation) => {
      compilation.hooks.processAssets.tapAsync(
        { name: PKG_NAME, stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE },
        async (assets, callback) => {
          await Context.create({
            root: compiler.context,
            dist: compiler.options.output.path || 'dist',
            options,
          })

          const queue = Object.entries(assets).map(async ([absolute, asset]) => {
            const id = relative(Context.root, absolute)
            const source = asset.source()
            const result = await compress(id, source)
            if (result.data?.isSmallerThanSourceFile) {
              const buffer = Buffer.from(result.data.compressed)
              compilation.updateAsset(absolute, new compiler.webpack.sources.RawSource(buffer))
            }
            Context.logger?.add(result)
          })

          await Promise.all(queue)

          callback()
        },
      )
    })

    compiler.hooks.done.tap(PKG_NAME, () => {
      const logger = compiler.getInfrastructureLogger(PKG_NAME)
      Context.logger?.printStats(logger.info.bind(logger))
    })
  }
}
