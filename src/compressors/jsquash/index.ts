import type { EncodeOptions as AvifOptions } from '@jsquash/avif/meta'
import type { EncodeOptions as JpegOptions } from '@jsquash/jpeg/meta'
import type { OptimiseOptions as OxipngOptions } from '@jsquash/oxipng/meta'
import type { EncodeOptions as WebpOptions } from '@jsquash/webp/meta'
import { defineCompressor } from '../../compressor'

import { compressAvif } from './avif'
import { compressMozJpeg } from './mozjpeg'
import { compressOxiPng } from './oxipng'
import { compressWebp } from './webp'

export const jsquash = defineCompressor('jsquash', (ctx) => {
  return {
    use: /(jpe?g|png|webp|avif)$/i,
    compress: async (input, fileType, options) => {
      const source = ctx.toArrayBuffer(input)

      switch (fileType.mime) {
        case 'image/jpeg':
        case 'image/jpg':
          return await compressMozJpeg(source, options?.jsquash?.mozjpeg)
        case 'image/png':
          return await compressOxiPng(source, options?.jsquash?.oxipng)
        case 'image/webp':
          return await compressWebp(source, options?.jsquash?.webp)
        case 'image/avif':
          return await compressAvif(source, options?.jsquash?.avif)
        default: return null
      }
    },
  }
})

export interface JsquashOptions {
  avif?: Partial<AvifOptions>
  mozjpeg?: Partial<JpegOptions>
  oxipng?: Partial<OxipngOptions>
  webp?: Partial<WebpOptions>
}
