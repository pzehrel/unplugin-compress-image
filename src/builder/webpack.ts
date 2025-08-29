import type { WebpackCompiler } from 'unplugin'
import type { FileDataType } from '../compressor'
import type { Options } from '../types'
import { compress } from '../compress'
import { CompressLogger } from '../logger'

export function createWebpackPlugin(options: Options | undefined, PKG_NAME: string): (compiler: WebpackCompiler) => void {
  const logger = new CompressLogger()

  return (compiler) => {
    compiler.hooks.thisCompilation.tap(PKG_NAME, (compilation) => {
      compilation.hooks.processAssets.tapAsync(
        { name: PKG_NAME, stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE },
        async (assets, callback) => {
          const root = compiler.context

          const sources = Object.entries(assets).reduce((acc, [filepath, asset]) => {
            const source = asset.source()
            if (typeof source !== 'string') {
              acc[filepath] = source
            }
            return acc
          }, {} as Record<string, FileDataType>)

          const files = await compress({ root, sources, options, logger })
          files.forEach(({ filepath, optimized }) => {
            if (assets[filepath]) {
              compilation.updateAsset(filepath, new compiler.webpack.sources.RawSource(optimized))
            }
          })
          callback()
        },
      )
    })

    compiler.hooks.done.tap(PKG_NAME, () => {
      logger.table()
    })
  }
}
