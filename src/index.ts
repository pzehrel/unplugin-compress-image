import type { UnpluginFactory } from 'unplugin'
import type { FileDataType } from './compressor'
import type { Options } from './types'
import { createUnplugin } from 'unplugin'
import { Compilation } from 'webpack'
import { name as PKG_NAME } from '../package.json'
import { compress } from './compress'

export const unpluginCompressImageFactory: UnpluginFactory<Options | undefined> = (options) => {
  let root = ''

  return {
    name: PKG_NAME,
    vite: {
      configResolved: (config) => {
        root = config.root
      },
      generateBundle: async (_, bundle) => {
        const sources = Object.entries(bundle).reduce((acc, [filepath, asset]) => {
          if (asset.type === 'asset' && typeof asset.source !== 'string') {
            acc[filepath] = asset.source
          }
          return acc
        }, {} as Record<string, FileDataType>)

        const { files, logger } = await compress({ root, sources, options })

        files.forEach(({ filepath, dest }) => {
          if (bundle[filepath] && bundle[filepath].type === 'asset') {
            bundle[filepath].source = dest
          }
        })
        logger.table()
      },
    },

    webpack: (compiler) => {
      compiler.hooks.thisCompilation.tap(PKG_NAME, (compilation) => {
        compilation.hooks.processAssets.tapAsync(
          { name: PKG_NAME, stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE },
          async (assets, callback) => {
            const root = compiler.context

            const sources = Object.entries(assets).reduce((acc, [filepath, asset]) => {
              const source = asset.source()
              if (typeof source !== 'string') {
                acc[filepath] = source
              }
              return acc
            }, {} as Record<string, FileDataType>)

            const { files, logger } = await compress({ root, sources, options })
            files.forEach(({ filepath, dest }) => {
              if (assets[filepath]) {
                compilation.updateAsset(filepath, new compiler.webpack.sources.RawSource(dest))
              }
            })

            logger.table()
            callback()
          },
        )
      })
    },

  }
}

export const unpluginCompressImage = /* #__PURE__ */ createUnplugin(unpluginCompressImageFactory)

export default unpluginCompressImage
