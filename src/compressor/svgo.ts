import { optimize } from 'svgo'
import { defineCompressor } from './compressor'

export const svgoCompressor = defineCompressor({
  name: 'svgo',
  test: ({ mime }, options) => options?.svgo !== false && mime === 'image/svg+xml',
  compress: async (file, _, options) => {
    const svg = new TextDecoder().decode(file)

    const { data } = optimize(svg, options?.svgo)

    return new TextEncoder().encode(data)
  },
})

export type { Config as SvgoConfig } from 'svgo'
