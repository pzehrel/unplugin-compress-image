import type { FileTypeResult } from 'file-type'
import type { FileDataType } from '../compressor'
import type { Options } from '../types'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { fileTypeFromBuffer } from 'file-type'

import { CompressCache } from '../cache'
import { toBuffer } from '../compress/utils'
import { jsquashCompressor, runCompressorTest, svgoCompressor, tinypngCompressor } from '../compressor'
import { CompressError, toArrayBuffer } from './utils'

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
  /**
   * compressor used
   *
   * If undefined, it means no compression was applied. file will be the same as sourceFile.
   */
  compressorName: string

  error?: CompressError
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

  const compressors = [...options?.compressors || [], jsquashCompressor, tinypngCompressor, svgoCompressor]

  const queue: Promise<{ file: ArrayBuffer, compressorName: string } | undefined | Error>[] = []

  for (const compressor of compressors) {
    if (!runCompressorTest(compressor, fileType, options)) {
      continue
    }

    const promise = compressor.compress(sourceFile, fileType, options).then((file) => {
      if (file === false) {
        return undefined
      }
      return { file: toArrayBuffer(file), compressorName: compressor.name }
    }).catch(error => error instanceof Error ? error : new Error(error?.toString() || 'Unknown error'))
    queue.push(promise)
  }

  const results = await Promise.allSettled(queue)

  let err: Error | undefined
  let best: { file: ArrayBuffer, compressorName: string } | undefined
  for (const result of results) {
    if (result.status !== 'fulfilled' || !result.value) {
      continue
    }

    if (result.value instanceof Error) {
      err = result.value
      continue
    }

    if (!best || result.value.file.byteLength < best.file.byteLength) {
      best = result.value
    }
  }

  if (!best) {
    throw new CompressError(`No suitable compressor found for file type: ${fileType.ext}`, filePath)
  }

  return createCompressResult(filePath, sourceFile, best.file, fileType, best.compressorName, !best ? err : undefined)
}

export async function compresses(root: string, filePaths: string[], options?: Options): Promise<CompressResult[]> {
  const compressCache = options?.cache === false ? undefined : new CompressCache(root, options?.cache?.dir)

  const results: CompressResult[] = []
  for await (const filePath of filePaths) {
    const sourceFile = (readFileSync(filePath))

    const file = compressCache?.get(sourceFile)
    if (file) {
      const fileType = await fileTypeFromBuffer(file)
      results.push(createCompressResult(filePath, sourceFile, file, fileType, 'cache'))
      continue
    }

    const result = await compressOne(filePath, sourceFile, options).catch((err) => {
      if (!(err instanceof CompressError)) {
        err = err instanceof Error
          ? new CompressError(err.message, filePath)
          : new CompressError(`Compression failed for ${filePath}: ${String(err)}`, filePath)
      }
      return createCompressResult(filePath, sourceFile, sourceFile, undefined, 'none', err)
    })
    results.push(result)
    if (!result.error) {
      compressCache?.save(sourceFile, toBuffer(result.file))
    }
  }
  return results
}

export async function writeFileFromArrayBuffer(filePath: string, file: ArrayBuffer): Promise<void> {
  mkdirSync(basename(filePath), { recursive: true })
  await writeFile(filePath, toBuffer(file))
}

function createCompressResult(filePath: string, source: FileDataType, dest: FileDataType, fileType: FileTypeResult | undefined, compressorName: string, error?: any): CompressResult {
  source = toArrayBuffer(source)
  dest = toArrayBuffer(dest)

  if (error) {
    error = error instanceof CompressError
      ? error
      : error instanceof Error
        ? new CompressError(error.message, filePath)
        : new CompressError(`Compression failed for ${String(error)}`, filePath)
  }

  return {
    filePath,
    before: source.byteLength,
    after: dest.byteLength,
    rate: dest.byteLength / source.byteLength,
    file: dest,
    mime: fileType?.mime || '',
    compressorName,
    error,
  }
}
