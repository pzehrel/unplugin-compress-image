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
      const source = ctx.utils.toArrayBuffer(input)

      if (fileType.mime === 'image/png' && options?.jsquash?.oxipng !== false) {
        return compressOxiPng(source, options?.jsquash?.oxipng)
      }

      if ((fileType.mime === 'image/jpeg' || fileType.mime === 'image/jpg') && options?.jsquash?.mozjpeg !== false) {
        return compressMozJpeg(source, options?.jsquash?.mozjpeg)
      }

      if (fileType.mime === 'image/webp' && options?.jsquash?.webp !== false) {
        return compressWebp(source, options?.jsquash?.webp)
      }

      if (fileType.mime === 'image/avif' && options?.jsquash?.avif !== false) {
        return compressAvif(source, options?.jsquash?.avif)
      }

      return null
    },
  }
})

export interface JsquashOptions {
  avif?: false | Partial<AvifOptions>
  mozjpeg?: false | Partial<JpegOptions>
  oxipng?: false | Partial<OxipngOptions>
  webp?: false | Partial<WebpOptions>
}
