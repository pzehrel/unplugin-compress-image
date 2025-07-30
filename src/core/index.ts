// PNG oxipng（jsquash） → zopfli pngquant（imagemin）
// JPEG mozjpeg（jsquash）* 默认有损但可接近无损（quality 95+） 有损降质量（quality 75）
// WebP sharp → lossless WebP 有损压缩（quality 75）
// AVIF sharp / jsquash lossless 有损 AVIF（quality 45~60）

import type { Options } from '../types'
import { join } from 'node:path'
import { tinypngApi } from './tinypng-api'

interface onOptimizedOneParams {
  optimized: Uint8Array
  original: Uint8Array
  fileName: string
  rate: number
}

interface CompressImagesOptions {
  root: string
  options: Options | undefined
  fileMap: Record<string, Uint8Array>
  onOptimizedOne?: (params: onOptimizedOneParams) => void
}

export async function compressImages(opts: CompressImagesOptions): Promise<void> {
  const { options, fileMap, onOptimizedOne: onCompleteOne } = opts

  for (const [fileName, original] of Object.entries(fileMap)) {
    const filepath = join(opts.root, fileName)
    const optimized = await compressImage(options, filepath, original)

    onCompleteOne?.({
      optimized,
      original,
      fileName,
      rate: (optimized.length / original.length) * 100,
    })
  }
}

export async function compressImage(options: Options | undefined, filepath: string, original: Uint8Array): Promise<Uint8Array> {
  const optimized = await tinypngApi.compress({ file: original }, {})

  if (optimized instanceof ArrayBuffer) {
    return new Uint8Array(optimized)
  }
  return optimized
}
