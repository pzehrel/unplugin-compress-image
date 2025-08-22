import type { FileTypeResult } from 'file-type'
import type { Options } from '../types'
import type { Compressor } from './define'

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
  return typeof compressor.test === 'function' ? compressor.test(fileType, options) : compressor.test.test(fileType.ext)
}
