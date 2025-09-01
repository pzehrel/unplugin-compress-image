import { defineCompressor } from '../../compressor'
import { toArrayBuffer } from '../../utils'
import { compressAvif } from './avif'
import { compressMozJpeg } from './mozjpeg'
import { compressOxiPng } from './oxipng'
import { compressWebp } from './webp'

export type * from './types'

export const jsquash = defineCompressor<'jsquash'>({
  name: 'jsquash',
  use: /^image\/(jpe?g|png|webp|avif)/i,
  compress: async (input, fileType, options) => {
    const source = toArrayBuffer(input)
    let output: ArrayBuffer

    switch (fileType.mime) {
      case 'image/jpeg':
      case 'image/jpg':
        output = await compressMozJpeg(source, options?.jsquash?.mozjpeg)
        break
      case 'image/png':
        output = await compressOxiPng(source, options?.jsquash?.oxipng)
        break
      case 'image/webp':
        output = await compressWebp(source, options?.jsquash?.webp)
        break
      case 'image/avif':
        output = await compressAvif(source, options?.jsquash?.avif)
        break
      default: return null
    }

    return output
  },
})
