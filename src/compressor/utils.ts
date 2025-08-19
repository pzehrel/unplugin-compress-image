import type { FileTypeResult } from 'file-type'
import type { Options } from '../types'
import type { FileDataType } from '../utils'
import type { Compressor } from './compressor'
import { existsSync, readFileSync } from 'node:fs'
import { fileTypeFromBuffer } from 'file-type'
import { toArrayBuffer } from '../utils'

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

/**
 * Run a compressor on a file.
 * @param compressor The compressor to use.
 * @param file The file to compress, can be a path or an ArrayBuffer.
 * @param fileType The file type of the input file.
 * @param options The options to pass to the compressor.
 * @returns A Promise that resolves to the compressed file as an ArrayBuffer.
 */
export async function runCompressor(compressor: Compressor, file: string | ArrayBuffer, fileType?: FileTypeResult, options?: Options): Promise<ArrayBuffer> {
  file = getFile(file)

  fileType = fileType || await fileTypeFromBuffer(file)
  if (!fileType) {
    throw new Error('Could not determine file type from buffer')
  }

  if (!runCompressorTest(compressor, fileType)) {
    throw new Error(`${compressor.name} Compressor does not support file type: ${fileType.mime}`)
  }

  const output = await compressor.compress(file, fileType, options)
  return toArrayBuffer(output)
}

export function getFile(file: string | FileDataType): ArrayBuffer {
  if (typeof file === 'string') {
    if (!existsSync(file)) {
      throw new Error(`File not found: ${file}`)
    }
    file = readFileSync(file)
  }

  return toArrayBuffer(file)
}

export function filterCompressor(fileType: FileTypeResult, ...compressors: Compressor[]): Compressor[] {
  return compressors.filter(compressor => runCompressorTest(compressor, fileType))
}
