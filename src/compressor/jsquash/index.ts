import { defineCompressor } from '../define'
import { compressAvif } from './avif'
import { compressMozJpeg } from './mozjpeg'
import { compressOxiPng } from './oxipng'
import { compressWebp } from './webp'

export type { JsquashAvifOpts } from './avif'
export type { JsquashMozJpegOpts } from './mozjpeg'
export type { JsquashOxiPngOpts } from './oxipng'
export type { JsquashWebpOpts } from './webp'

export const jsquashCompressor = defineCompressor(() => {
  return {
    name: 'jsquash',
    test: /\.(jpe?g|png|webp|avif)$/i,
    compress: async (file, fileType, options) => {
      let output: ArrayBuffer

      switch (fileType.ext) {
        case 'image/jpeg':
        case 'image/jpg':
          output = await compressMozJpeg(file, options?.jsquash?.mozjpeg)
          break
        case 'image/png':
          output = await compressOxiPng(file, options?.jsquash?.oxipng)
          break
        case 'image/webp':
          output = await compressWebp(file, options?.jsquash?.webp)
          break
        case 'image/avif':
          output = await compressAvif(file, options?.jsquash?.avif)
          break
        default: throw new Error(`Unsupported file type: ${fileType.ext}`)
      }

      return output
    },
  }
})
