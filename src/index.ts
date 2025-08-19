import type { UnpluginFactory } from 'unplugin'
import type { CompressResult } from './compressor'
import type { Options } from './types'
import { join } from 'node:path'
import { createUnplugin } from 'unplugin'
import { name as PKG_NAME } from '../package.json'
import { compressOne } from './compressor'

export const unpluginCompressImageFactory: UnpluginFactory<Options | undefined> = (options) => {
  let root = ''
  // let outputPath = ''

  return {
    name: PKG_NAME,
    vite: {
      configResolved: (config) => {
        root = config.root
        // outputPath = config.build.outDir
      },
      generateBundle: async (_, bundle) => {
        const results: CompressResult[] = []
        for (const filename in bundle) {
          const asset = bundle[filename]
          if (asset.type !== 'asset' || typeof asset.source === 'string') {
            continue
          }
          const filepath = join(root, filename)
          const result = await compressOne(filepath, asset.source, options)
          results.push(result)
        }

        // const files: Files = []
        // for (const filename in bundle) {
        //   const asset = bundle[filename]
        //   if (asset.type === 'asset' && typeof asset.source !== 'string') {
        //     const path = join(outputPath, filename)
        //     files.push({ path, fileData: asset.source })
        //   }
        // }
        // await compressMultiple({ root, files, options })
      },
    },
  }
}

export const unpluginCompressImage = /* #__PURE__ */ createUnplugin(unpluginCompressImageFactory)

export default unpluginCompressImage
