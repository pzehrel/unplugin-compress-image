import type { FileTypeResult } from 'file-type'
import type { Buffer } from 'node:buffer'
import type { Options } from '../types'
import type { Compressor, CompressorOptions, FileDataType } from './define'
import { fileTypeFromBuffer } from 'file-type'
import { CompressError, toArrayBuffer, toBuffer } from '../utils'
import { jsquashCompressor } from './jsquash'
import { svgoCompressor } from './svgo'
import { tinypngCompressor } from './tinypng'

export * from './define'
export * from './jsquash'
export * from './svgo'
export * from './tinypng'

/**
 * Check if a compressor can be used for a given file type.
 * @param compressor The compressor to check.
 * @param fileType The file type to check against.
 * @returns A boolean indicating if the compressor can be used.
 */
export function runCompressorTest(compressor: Compressor, fileType: FileTypeResult, options?: Options): boolean {
  if (!compressor.test) {
    return true
  }
  return typeof compressor.test === 'function' ? compressor.test(fileType, options) : compressor.test.test(`.${fileType.ext}`)
}

/**
 * Compress a file using the specified compressor.
 * @param compressor The compressor to use.
 * @param source The file to compress.
 * @param fileType The file type of the source file.
 * @param options Optional compression options.
 */
export async function runCompressor(compressor: Compressor, source: FileDataType, fileType: FileTypeResult, options: CompressorOptions): Promise<Buffer | false> {
  source = toArrayBuffer(source)
  const result = await compressor.compress(source, fileType, options)

  if (result === false) {
    return false
  }
  return toBuffer(result)
}

/**
 * run multiple compressors and return the best result (smallest size).
 * @param usedCompressors array of compressors to run
 * @param filePath file id (for error reporting)
 * @param source source file
 * @param fileType source file type
 * @param options optional compression options
 */
export async function runCompressorsByBestSize(
  source: FileDataType,
  options: CompressorOptions,
): Promise<CompressError | { file: Buffer, compressor: Compressor }> {
  const fileType = await fileTypeFromBuffer(source)
  if (!fileType) {
    return new CompressError('File type not recognized')
  }

  const compressors = [...options?.compressors || [], jsquashCompressor, svgoCompressor]
  const usedCompressors = compressors.filter(compressor => runCompressorTest(compressor, fileType, options))

  const queue = usedCompressors.map(async (compressor) => {
    const file = await runCompressor(compressor, source, fileType, options)
    return { file, compressor }
  })
  const results = await Promise.allSettled(queue)

  let best: Buffer | undefined
  let bestCompressor: Compressor | undefined
  let error: CompressError | undefined

  for (const result of results) {
    if (result.status === 'rejected') {
      error = CompressError.from(result.reason)
      continue
    }

    const { file, compressor } = result.value
    if (file === false) {
      continue
    }

    if (!best || file.byteLength < best.byteLength) {
      best = file
      bestCompressor = compressor
    }
  }

  if (!best && error) {
    return error
  }

  if (!best && !error) {
    return new CompressError('No compressor succeeded')
  }

  return { file: best!, compressor: bestCompressor! }
}
