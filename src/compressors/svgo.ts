import { optimize } from 'svgo'
import { defineCompressor } from '../compressor'

export const svgo = defineCompressor('svgo', {
  use: /image\/svg\+xml/i,
  compress: async (file, _, options) => {
    const svg = new TextDecoder().decode(file)
    const { data } = optimize(svg, options?.svgo)
    return new TextEncoder().encode(data)
  },
})

export type { Config as SvgoConfig } from 'svgo'
