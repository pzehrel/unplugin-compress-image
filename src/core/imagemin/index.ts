import type { Compressor } from '../compressor'
import imagemin from 'imagemin'
import gifsicle from 'imagemin-gifsicle'
import jpegtran from 'imagemin-jpegtran'
import mozjpeg from 'imagemin-mozjpeg'
import pngquant from 'imagemin-pngquant'
import webp from 'imagemin-webp'

export const imageminCompressor: Compressor = async (input) => {
  const chunks: Buffer[] = []
  for await (const chunk of input.file) {
    chunks.push(Buffer.from(chunk))
  }
  const buffer = Buffer.concat(chunks)

  const compressedUint8Array = await imagemin.buffer(buffer, {
    plugins: [
      pngquant(),
      mozjpeg(),
      jpegtran(),
      webp(),
      gifsicle(),
    ],
  })
  const compressedBuffer = Buffer.from(compressedUint8Array)

  return {
    file: compressedBuffer,
  }
}
