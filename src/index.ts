import type { RolldownPlugin, UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { createUnplugin } from 'unplugin'
import { name as PKG_NAME } from '../package.json'
import { createRollupPlugin } from './builder/rollup'
import { createWebpackPlugin } from './builder/webpack'

export const unpluginCompressImageFactory: UnpluginFactory<Options | undefined> = (options) => {
  return {
    name: PKG_NAME,
    rollup: createRollupPlugin(options),
    vite: createRollupPlugin(options),
    rolldown: createRollupPlugin(options) as Partial<RolldownPlugin>,
    webpack: createWebpackPlugin(options, PKG_NAME),
  }
}

export const unpluginCompressImage = /* #__PURE__ */ createUnplugin(unpluginCompressImageFactory)

export default unpluginCompressImage

export { defineCompressor } from './compressor'
export type { Compressor } from './compressor'
