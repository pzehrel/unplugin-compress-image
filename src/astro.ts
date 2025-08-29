import type { Options } from './types'
import unpluginCompressImage from '.'

import { name as PKG_NAME } from '../package.json'

export default (options: Options): any => ({
  name: PKG_NAME,
  hooks: {
    'astro:config:setup': async (astro: any) => {
      astro.config.vite.plugins ||= []
      astro.config.vite.plugins.push(unpluginCompressImage.vite(options))
    },
  },
})
