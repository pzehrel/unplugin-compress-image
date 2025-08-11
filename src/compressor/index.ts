import type { FileTypeResult } from 'file-type'
import type { Options } from '../types'
import type { Compressor, FileData } from './compressor'
import { createReadStream, existsSync } from 'node:fs'
import { join } from 'node:path'
import { PassThrough } from 'node:stream'
import { fileTypeFromStream } from 'file-type'
import { compressorCanUse } from './compressor'
import { tinypng } from './tinypng'
import { CompressError, saveToFile, toBuffer, toReadable } from './utils'

export type Files = ({ path: string, outputpath?: string, fileData: FileData })[]

export interface CompressMultipleOpts {
  root: string
  options?: Options
  files: Files | string[]

  onOptimized?: (result: CompressResult | CompressError, current: number, total: number) => void
}

interface CompressResult {
  /** 压缩前的大小 */
  beforeSize: number
  /** 压缩后的大小 */
  afterSize: number
  /** 压缩率，压缩后大小 / 压缩前大小 */
  rate: number
  /** 是否进行了写入操作，rate>1不会写入 */
  isWrite: boolean
  /** 压缩的文件路径 */
  filepath: string
  /** 压缩后的输出路径 */
  outputpath: string
}

export async function compressMultiple(opts: CompressMultipleOpts): Promise<(CompressResult | CompressError)[]> {
  const { root, options, files } = opts

  const results: (CompressResult | CompressError)[] = []

  let index = 0
  for await (const file of files) {
    const { path, outputpath, fileData } = typeof file === 'string' ? { path: file } : file
    const filepath = join(root, path)
    const result = await compress({ filepath, outputpath, fileData, options }).catch((error: Error) => {
      const cerr = new CompressError(`Error compressing file ${filepath}: ${error.message}`)
      cerr.stack = error.stack
      return cerr
    })
    results.push(result)
    if (opts.onOptimized) {
      opts.onOptimized(result, index, files.length)
    }
    index++
  }

  return results
}

interface CompressOpts {
  /** 文件路径 */
  filepath: string
  /** 输出路径，如果不提供则覆盖原文件 */
  outputpath?: string
  /** 文件数据，如果提供则使用此数据而不是读取文件 */
  fileData?: FileData
  /** 压缩选项 */
  options?: Options
}
export async function compress(opts: CompressOpts): Promise<CompressResult> {
  let { filepath, outputpath, fileData, options } = opts
  outputpath = outputpath || filepath

  if (!fileData && !existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`)
  }

  fileData = toReadable(fileData || createReadStream(filepath))

  let beforeSize = 0
  fileData.on('data', (chunk) => {
    beforeSize += chunk.length
  })

  const fileType = await fileTypeFromStream(fileData.pipe(new PassThrough()))
  if (!fileType) {
    throw new Error('Could not determine file type')
  }

  const compressor = getCompressors(fileType, options)
  if (!compressor) {
    throw new Error(`No suitable compressor found for file type: ${fileType.mime}`)
  }

  const input = fileData.pipe(new PassThrough())
  const optimized = await compressor.compress(input, fileType, options)
  const output = await toBuffer(optimized)

  const afterSize = output.length
  const rate = beforeSize > 0 ? (afterSize / beforeSize) : 1
  const isWrite = beforeSize > afterSize

  if (isWrite) {
    await saveToFile(output, outputpath)
  }

  return { beforeSize, afterSize, rate, isWrite, filepath, outputpath }
}

export { Compressor, defineCompressor } from './compressor'

function getCompressors(fileType: FileTypeResult, options?: Options): Compressor | undefined {
  const compressors = options?.compressors || [tinypng]
  if (Array.isArray(compressors)) {
    return compressors.find(compressor => compressorCanUse(compressor, fileType))
  }

  // TODO
  return tinypng
}
