import { optimize } from 'svgo'
import { defineCompressor } from './define'

export const svgoCompressor = defineCompressor({
  name: 'svgo',
  test: ({ mime }, options) => options?.svgo !== false && mime === 'image/svg+xml',
  compress: async (file, _, options) => {
    if (options?.svgo === false) {
      return false
    }
    const svg = new TextDecoder().decode(file)

    const { data } = optimize(svg, options?.svgo)

    return new TextEncoder().encode(data)
  },
})

export type { Config as SvgoConfig } from 'svgo'
