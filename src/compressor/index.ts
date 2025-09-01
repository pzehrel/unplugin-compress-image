import type { FileTypeResult } from 'file-type'
import type { CompressLogger } from '../common'
import type { Code, FileDataType, Options } from '../types'
import type { Compressor, CompressorFn, CompressorFnContext } from './types'
import { fileTypeFromBuffer } from 'file-type'
import MagicString from 'magic-string'
import { builtInCompressors } from '../compressors'
import { _contextUtils, CompressError, computedRate, isCode, toUnit8Array } from '../utils'

export * from './types'

const compressorMap = new Map<string | CompressorFn, Compressor>()

export function initCompressors(options?: Options): void {
  const context: CompressorFnContext = { options, ..._contextUtils }
  if (compressorMap.size === 0) {
    for (const compressor of builtInCompressors) {
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

interface CompressOptions<S = FileDataType | MagicString> {
  id: string
  source: S
  options?: Options
  logger?: CompressLogger
  root: string
}

interface CompressResult<S = Uint8Array | MagicString> {
  id: string
  rate: number
  data?: S
}

export async function compress(opts: CompressOptions<Code>): Promise<CompressResult<MagicString>>
export async function compress(opts: CompressOptions<FileDataType>): Promise<CompressResult<Uint8Array>>
export async function compress({ id, source, options, logger }: CompressOptions): Promise<CompressResult> {
  // base64 images in js/css source code
  if (isCode(source)) {
    // skip souce code compression
    if (options?.base64 === false) {
      return { id, data: undefined, rate: 1 }
    }

    const result = await compressCode(id, source, options)
    const { code, replaces } = result

    if (logger) {
      for (const { start, source, best, error } of replaces) {
        const rid = `${id} (at ${start})`
        if (error) {
          logger.fail(rid, error, error.compressor)
        }
        else if (best) {
          logger.success(rid, source, best.data, best.compressor.name)
        }
      }
    }

    const rate = computedRate(source.toString().length, code.toString().length)

    return { id, data: code, rate }
  }

  // asset binary data or base64 image string
  source = toUnit8Array(source)
  const result = await compressAsset(id, source, options)
  if (result instanceof CompressError) {
    logger?.fail(id, result, result.compressor)
  }
  else {
    logger?.success(id, source, result.data, result.compressor.name)
  }

  const isError = result instanceof CompressError
  if (isError) {
    return { id, rate: 1 }
  }

  return {
    id,
    data: result.data,
    rate: computedRate(source.byteLength, result.data.byteLength),
  }
}

interface CompressAssetResult {
  data: Uint8Array
  compressor: Compressor
}

export async function compressAsset(id: string, source: FileDataType, options?: Options): Promise<CompressAssetResult | CompressError> {
  source = toUnit8Array(source)

  const fileType = await fileTypeFromBuffer(source)
  if (!fileType) {
    const error = new CompressError('get file type failed', id)
    return error
  }

  if (compressorMap.size === 0) {
    initCompressors(options)
  }

  const queue: Promise<CompressAssetResult | CompressError>[] = []

  compressorMap.forEach((compressor) => {
    if (!canUse(compressor, fileType)) {
      return
    }

    const item = runAwaitable(() => compressor.compress(source, fileType, options))
      .then((data) => {
        if (!data) {
          throw new CompressError('not compressed', id)
        }
        return { data: toUnit8Array(data), compressor }
      })
      .catch((err) => {
        const error = CompressError.from(err, id)
        error.compressor = compressor.name
        return error
      })

    queue.push(item)
  })

  const results = await Promise.all(queue)

  const { best = null, error } = results.reduce((acc, item) => {
    if (item instanceof CompressError) {
      acc.error = item
      return acc
    }

    const { data, compressor } = item
    if (!acc.best || acc.best.data.byteLength > data.byteLength) {
      acc.best = { data, compressor }
    }

    return acc
  }, {} as { best?: CompressAssetResult, error?: CompressError })

  if (best) {
    return best
  }

  return error || new CompressError('no available compressors', id)
}

interface CompressCodeResult {
  code: MagicString
  replaces: { source: Uint8Array, best?: CompressAssetResult, start: number, error?: CompressError }[]
}

export async function compressCode(id: string, code: Code, options?: Options): Promise<CompressCodeResult> {
  code = code instanceof MagicString ? code : new MagicString(code)

  const matches = code.original.matchAll(/data:image\/[^;]+;base64,[A-Za-z0-9+/]+={0,2}/g)

  const queue = matches.map<Promise<CompressCodeResult['replaces'][number]>>(async (match) => {
    const source = toUnit8Array(match[0])

    const result = await compressAsset(id, source, options)

    const start = match.index!

    if (result instanceof CompressError) {
      return { start, error: result, source }
    }

    return { start, source, best: result }
  })

  const replaces = await Promise.all(queue)
  return { code, replaces }
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
