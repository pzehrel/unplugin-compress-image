import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { createUnplugin } from 'unplugin'
import { name as PKG_NAME } from '../package.json'
import { createVitePlugin } from './builder/vite'
import { createWebpackPlugin } from './builder/webpack'

export const unpluginCompressImageFactory: UnpluginFactory<Options | undefined> = (options) => {
  return {
    name: PKG_NAME,
    vite: createVitePlugin(options),
    webpack: createWebpackPlugin(options, PKG_NAME),
  }
}

export const unpluginCompressImage = /* #__PURE__ */ createUnplugin(unpluginCompressImageFactory)

export default unpluginCompressImage
