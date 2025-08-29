import type { FileTypeResult } from 'file-type'
import type { Buffer } from 'node:buffer'
import type { Compressor, FileDataType } from '../compressor'
import type { CompressLogger } from '../logger'
import type { Options } from '../types'
import { readFileSync } from 'node:fs'
import { fileTypeFromBuffer } from 'file-type'
import { CompressCache } from '../cache'
import { runCompressorsByBestSize } from '../compressor'
import { CompressError, getFileSize } from '../utils'

export interface CompressOpts {
  root: string
  sources: Record<string, FileDataType>
  options?: Options
  logger?: CompressLogger
}

interface Success {
  /** filepath， if base64 will be data URL */
  filepath: string
  /** source file */
  source: FileDataType
  /** optimized file */
  optimized: Buffer
  /** real file type */
  fileType: FileTypeResult
  /** which compressor */
  compressor: Compressor | 'cache'
}

interface Fail {
  filepath: string
  source: FileDataType
  error: CompressError
}

export async function compress({ root, options, sources, logger }: CompressOpts): Promise<Success[]> {
  const opts = { root, ...options }

  const cache = options?.cache === false ? undefined : new CompressCache(root, options?.cache?.dir)

  const tasks = Object.entries(sources).map<() => Promise<Success | Fail>>(([filepath, source]) => async () => {
    const cacheFile = cache?.get(source)
    if (cacheFile) {
      logger?.push({ id: filepath, before: getFileSize(source), after: cacheFile.byteLength, compressor: 'cache' })
      return { filepath, source, optimized: cacheFile, compressor: 'cache', fileType: (await fileTypeFromBuffer(cacheFile))! }
    }

    const dest = await runCompressorsByBestSize(source, opts)

    if (CompressError.is(dest)) {
      logger?.push({ id: filepath, error: dest })
      return { filepath, source, error: dest }
    }
    const { file, compressor, fileType } = dest
    cache?.save(source, file)
    logger?.push({ id: filepath, before: getFileSize(source), after: file.byteLength, compressor: compressor.name })
    return { filepath, source, optimized: file, compressor, fileType }
  })

  const files = (await Promise.all(tasks.map(task => task()))).filter(r => 'optimized' in r)

  return files
}

interface CompressOneOpts {
  id: string
  source: FileDataType
  options?: Options
  logger?: CompressLogger
}
export async function compressOne({ id, source, options, logger }: CompressOneOpts): Promise<Buffer | null> {
  const result = await runCompressorsByBestSize(source, options || {})

  if (CompressError.is(result)) {
    logger?.push({ id, error: result })
    return null
  }

  const { file, compressor } = result
  logger?.push({ id, before: getFileSize(source), after: file.byteLength, compressor: compressor.name })
  return file
}
