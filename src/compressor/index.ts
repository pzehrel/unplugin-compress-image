import type { FileTypeResult } from 'file-type'
import type { Base64, Code, FileDataType, Options } from '../types'
import type { Compressor, CompressorContext, CompressorFn } from './types'
import { fileTypeFromBuffer } from 'file-type'
import MagicString from 'magic-string'
import { Context } from '../common'
import { getBuiltInCompressors } from '../compressors'
import { _contextUtils, CompressError, isBinary, toBase64, toUnit8Array } from '../utils'

export * from './types'

const compressorMap = new Map<string | CompressorFn, Compressor>()

export async function initCompressors(options?: Options): Promise<void> {
  const context: CompressorContext = { options, utils: _contextUtils }

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

  await Promise.all([...compressorMap.values()].map(c => c.init?.(context)))
}

interface CompressResult<S extends FileDataType | Code> {
  id: string
  data?: S extends Code ? CompressCodeResult : CompressBinaryResult
}

export async function compress<T extends FileDataType | Code>(id: string, source: T): Promise<CompressResult<T>>
export async function compress(id: string, source: FileDataType | Code): Promise<CompressResult<any>> {
  if (isBinary(source)) {
    const result = await compressBinary(id, source)
    if (result instanceof CompressError || result === null) {
      return { id }
    }
    return { id, data: result }
  }

  const result = await compressCode(id, source)
  if (result === null) {
    return { id }
  }
  return { id, data: result }
}

interface CompressBinaryResult {
  source: Uint8Array
  compressed: Uint8Array
  compressor: Compressor | string
  isSmallerThanSourceFile: boolean
}

/**
 * Compress binary data (image file or base64 image string)
 *
 * - return `CompressBinaryResult` means compression success
 * - return `CompressError` means compression failed
 * - return `null` means no available compressors
 *
 * @param id file id or path
 * @param source file data or base64 image string
 */
export async function compressBinary(id: string, source: FileDataType | Base64): Promise<CompressBinaryResult | CompressError | null> {
  source = toUnit8Array(source)

  const cache = Context.cache?.get(source)
  if (cache) {
    return {
      id,
      compressed: cache,
      isSmallerThanSourceFile: true,
      source,
      compressor: 'cache',
    }
  }

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
      const promise = runAwaitable(() => compressor.compress(source, fileType, Context.options))
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

  if (best && best.isSmallerThanSourceFile) {
    Context.cache?.set(source, best.compressed)
  }

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
 * Compress base64 image strings in JS/CSS code
 *
 * - return `null` means no base64 images found
 * - return `CompressCodeResult` means compression success
 *
 * @param id JS/CSS file path
 * @param code JS/CSS source code
 */
export async function compressCode(id: string, code: Code): Promise<CompressCodeResult | null> {
  const mc = new MagicString(code)

  const matches = mc.original.matchAll(/data:image\/[^;]+;base64,[A-Za-z0-9+/]+={0,2}/g)

  const queue: Promise<CompressCodeResult['replaces'][number]>[] = []
  for (const match of matches) {
    queue.push((async () => {
      const source = toUnit8Array(match[0])
      const result = await compressBinary(id, source)
      const start = match.index
      const end = start + source.length
      const replaceId = `${id} [${start}:${end}]`

      if (result instanceof CompressError) {
        return { start, error: result, source, replaceId, end }
      }

      if (result?.isSmallerThanSourceFile) {
        mc.overwrite(start, end, await toBase64(result.compressed))
      }

      return { start, source, best: result || undefined, replaceId, end }
    })())
  }

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
