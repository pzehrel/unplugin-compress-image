import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { createUnplugin } from 'unplugin'
import { compressImages } from './core'

export const unpluginCompressImageFactory: UnpluginFactory<Options | undefined> = (options) => {
  let root = ''
  // let outputPath = ''

  return {
    name: 'unplugin-compress-image',

    vite: {
      configResolved: (config) => {
        root = config.root
        // outputPath = config.build.outDir
      },
      generateBundle: async (_, bundle) => {
        const fileMap = Object.entries(bundle).reduce((acc, [fileName, asset]) => {
          if (asset.type === 'asset' && typeof asset.source !== 'string') {
            acc[fileName] = asset.source
          }
          return acc
        }, {} as Record<string, Uint8Array>)

        await compressImages({
          root,
          options,
          fileMap,
          // onOptimizedOne: () => {

          // },
        })
      },
    },
  }
}

export const unpluginCompressImage = /* #__PURE__ */ createUnplugin(unpluginCompressImageFactory)

export default unpluginCompressImage
