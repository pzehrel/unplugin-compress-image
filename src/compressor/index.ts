import type { Options } from '../types'
import type { FileDataType } from '../utils'
import type { Compressor } from './compressor'
import { existsSync, readFileSync } from 'node:fs'
import { fileTypeFromBuffer } from 'file-type'
import { CompressError, toArrayBuffer } from '../utils'
import { jsquashCompressor } from './jsquash'
import { tinypng } from './tinypng'
import { filterCompressor } from './utils'

export interface CompressResult {
  /** source file size */
  before: number
  /** compressed file size */
  after: number
  /** compression rate */
  rate: number
  /** source file path */
  filePath: string
  /** whether the file was written */
  file: ArrayBuffer
  /** real mime type of the file */
  mime: string
  /** compressor used */
  compressor: Compressor
}

export interface CompressFail {
  /** source file path */
  filePath: string

  /** error message */
  error: Error
}

export async function compressOne(filePath: string, sourceFile?: FileDataType, options?: Options): Promise<CompressResult> {
  if (!sourceFile) {
    if (!existsSync(filePath)) {
      throw new CompressError(`File not found: ${filePath}`, filePath)
    }
    sourceFile = readFileSync(filePath)
  }
  sourceFile = toArrayBuffer(sourceFile)

  const fileType = await fileTypeFromBuffer(sourceFile)
  if (!fileType) {
    throw new CompressError(`Could not determine file type for: ${filePath}`, filePath)
  }

  const compressors = filterCompressor(fileType, ...options?.compressors || [], jsquashCompressor, tinypng)
  if (compressors.length === 0) {
    throw new CompressError(`No suitable compressor found for file type: ${fileType.mime}`, filePath)
  }

  const queue = compressors.map(async (compressor) => {
    const file = await compressor.compress(sourceFile, fileType, options)
    return { file: toArrayBuffer(file), compressor }
  })

  const results = await Promise.allSettled(queue).then((results) => {
    return results.filter(result => result.status === 'fulfilled').map(result => result.value)
  })

  if (results.length === 0) {
    throw new CompressError(`All compressors failed for file: ${filePath}`, filePath)
  }

  // find the best result based on file size
  const compressed = results.sort((a, b) => a.file.byteLength - b.file.byteLength)[0]

  return {
    ...compressed,
    before: sourceFile.byteLength,
    after: compressed.file.byteLength,
    rate: compressed.file.byteLength / sourceFile.byteLength,
    mime: fileType.mime,
    filePath,
  }
}

export async function compresses(filePaths: string[], options?: Options): Promise<CompressResult[]> {
  const results: CompressResult[] = []
  for await (const filePath of filePaths) {
    const result = await compressOne(filePath, undefined, options)
    results.push(result)
  }
  return results
}

export { defineCompressor } from './compressor'
export type { Compressor, SupportType } from './compressor'
