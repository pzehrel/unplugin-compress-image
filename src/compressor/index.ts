import type { FileTypeResult } from 'file-type'
import type { Base64, Code, FileDataType, Options } from '../types'
import type { Compressor, CompressorFn, CompressorFnContext } from './types'
import { fileTypeFromBuffer } from 'file-type'
import MagicString from 'magic-string'
import { getBuiltInCompressors } from '../compressors'
import { _contextUtils, CompressError, isBinary, toBase64, toUnit8Array } from '../utils'

export * from './types'

const compressorMap = new Map<string | CompressorFn, Compressor>()

export function initCompressors(options?: Options): void {
  const context: CompressorFnContext = { options, ..._contextUtils }
  if (compressorMap.size === 0) {
    for (const compressor of getBuiltInCompressors(options)) {
      compressorMap.set(compressor, compressor(context))
    }
  }

  for (const custom of options?.compressors || []) {
    const key = typeof custom === 'function' ? custom : custom.name
    if (compressorMap.has(key)) {
      continue
    }
    compressorMap.set(key, typeof custom === 'function' ? custom(context) : custom)
  }
}

interface CompressOptions<Source extends FileDataType | Code> {
  id: string
  source: Source
  options?: Options
  root: string
}

interface CompressResult<S extends FileDataType | Code> {
  id: string
  data?: S extends Code ? CompressCodeResult : CompressBinaryResult
}

export async function compress<T extends FileDataType | Code>(params: CompressOptions<T>): Promise<CompressResult<T>>
export async function compress(params: CompressOptions<any>): Promise<CompressResult<any>> {
  const { id, options } = params
  if (isBinary(params.source)) {
    const result = await compressBinary(id, params.source, options)
    if (result instanceof CompressError || result === null) {
      return { id }
    }
    return { id, data: result }
  }

  const result = await compressCode(id, params.source, options)
  if (result === null) {
    return { id }
  }
  return { id, data: result }
}

interface CompressBinaryResult {
  source: Uint8Array
  compressed: Uint8Array
  compressor: Compressor
  isSmallerThanSourceFile: boolean
}

/**
 * compress binary data (image file or base64 image string)
 *
 * - return `CompressBinaryResult` means compress success
 * - return `CompressError` means compress failed
 * - return `null` means no available compressors
 *
 * @param id file id or path
 * @param source file data or base64 image string
 * @param options unplugin options
 */
export async function compressBinary(id: string, source: FileDataType | Base64, options?: Options): Promise<CompressBinaryResult | CompressError | null> {
  source = toUnit8Array(source)

  const fileType = await fileTypeFromBuffer(source)
  if (!fileType) {
    const error = new CompressError('get file type failed', id)
    return error
  }

  const queue: Promise<CompressBinaryResult | CompressError | null>[] = []

  compressorMap.forEach((compressor) => {
    if (!canUse(compressor, fileType)) {
      return
    }

    queue.push((async () => {
      const promise = runAwaitable(() => compressor.compress(source, fileType, options))
      const result = await promise.catch(error => CompressError.from(error, id))
      if (CompressError.is(result)) {
        result.compressor = compressor.name
        return result
      }

      if (!result) {
        return null
      }

      return {
        source,
        compressed: toUnit8Array(result),
        compressor,
        isSmallerThanSourceFile: result.byteLength < source.byteLength,
      }
    })())
  })

  const results = await Promise.all(queue)

  const { best = null, error = null } = results.reduce((acc, item) => {
    if (item instanceof CompressError) {
      acc.error = item
    }
    else if (item !== null) {
      acc.best = item
    }
    return acc
  }, {} as { best?: CompressBinaryResult, error?: CompressError })

  return best || error
}

interface CompressCodeResult {
  source: Code
  compressed: Code
  isSmallerThanSourceFile: boolean
  replaces: {
    replaceId: string
    start: number
    end: number
    source: Uint8Array
    best?: CompressBinaryResult
    error?: CompressError
  }[]
}

/**
 * Compress base64 image strings in js/css code
 *
 * - return `null` means no base64 image found
 * - return `CompressCodeResult` means compress success
 *
 * @param id js/css file path
 * @param code js/css source code
 * @param options unplugin options
 */
export async function compressCode(id: string, code: Code, options?: Options): Promise<CompressCodeResult | null> {
  const mc = new MagicString(code)

  const matches = mc.original.matchAll(/data:image\/[^;]+;base64,[A-Za-z0-9+/]+={0,2}/g)

  const queue = matches.map<Promise<CompressCodeResult['replaces'][number]>>(async (match) => {
    const source = toUnit8Array(match[0])
    const result = await compressBinary(id, source, options)
    const start = match.index
    const end = start + source.length
    const replaceId = `${id}_[${start}:${end}]`

    if (result instanceof CompressError) {
      return { start, error: result, source, replaceId, end }
    }

    if (result?.isSmallerThanSourceFile) {
      mc.overwrite(start, end, await toBase64(result.compressed))
    }

    return { start, source, best: result || undefined, replaceId, end }
  })

  const replaces = await Promise.all(queue)

  if (replaces.length === 0) {
    return null
  }

  const resultCode = mc.toString()
  return {
    source: code,
    compressed: resultCode,
    isSmallerThanSourceFile: resultCode.length < code.length,
    replaces,
  }
}

function canUse(compressor: Compressor, fileType: FileTypeResult, options?: Options): boolean {
  // built-in compressor disabled
  if (options && compressor.name in options && (options as any)[compressor.name] === false) {
    return false
  }

  if (!compressor.use) {
    return true
  }
  if (typeof compressor.use === 'function') {
    return compressor.use(fileType)
  }
  return compressor.use.test(fileType.ext)
    || compressor.use.test(fileType.mime)
    || compressor.use.test(`.${fileType.ext}`)
}

function runAwaitable<R>(fn: () => R | Promise<R>): Promise<R> {
  try {
    return Promise.resolve(fn())
  }
  catch (error) {
    return Promise.reject(error)
  }
}
