import type { FileTypeResult } from 'file-type'
import type { Base64, FileDataType } from '../compressor'
import { Buffer } from 'node:buffer'
import { cpus } from 'node:os'
import { fileTypeFromBuffer } from 'file-type'

export class CompressError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'CompressError'
  }

  static from(error: unknown): CompressError {
    if (error instanceof CompressError) {
      return error
    }
    if (error instanceof Error) {
      return new CompressError(error.message, { cause: error })
    }
    return new CompressError(String(error))
  }

  static is(value: unknown): value is CompressError {
    return value instanceof CompressError
  }
}

export function toU8Buffer(file: FileDataType): Uint8Array {
  if (typeof file === 'string') {
    const base64 = file.replace(/^data:\w+\/[a-zA-Z+\-.]+;base64,/, '')
    return Uint8Array.from(Buffer.from(base64, 'base64'))
  }

  if (file instanceof ArrayBuffer) {
    return new Uint8Array(file)
  }

  return file
}

export function toArrayBuffer(file: FileDataType): ArrayBuffer {
  if (typeof file === 'string') {
    const base64 = file.replace(/^data:\w+\/[a-zA-Z+\-.]+;base64,/, '')
    file = Buffer.from(base64, 'base64')
  }

  if (file instanceof Uint8Array) {
    return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer
  }
  return file
}

export function toBase64(file: FileDataType): Promise<Base64>
export function toBase64(file: FileDataType, fileType: FileTypeResult): Base64
export function toBase64(file: FileDataType, fileType?: FileTypeResult): Base64 | Promise<Base64> {
  if (typeof file === 'string') {
    return file
  }

  if (fileType) {
    const buffer = toU8Buffer(file)
    const b64 = Buffer.from(buffer).toString('base64')
    return `data:${fileType.mime};base64,${b64}`
  }

  return fileTypeFromBuffer(file).then((fileType) => {
    if (!fileType) {
      throw new CompressError('Unsupported file type')
    }
    return toBase64(file, fileType)
  }) as Promise<Base64>
}

export function size(file: FileDataType): number {
  if (typeof file === 'string') {
    const buffer = toU8Buffer(file)
    return buffer.byteLength
  }

  return file.byteLength
}

export async function runParallel<T, U>(tasks: T[], fn: (item: T, index: number, items: T[]) => Promise<U>, maxConcurrency = cpus().length): Promise<U[]> {
  const results: U[] = []
  const executing = new Set<Promise<void>>()

  for (let i = 0; i < tasks.length; i++) {
    const p = Promise.resolve().then(() => fn(tasks[i], i, tasks).then((result) => {
      results[i] = result
    })).finally(() => {
      executing.delete(p)
    })
    executing.add(p)
    if (executing.size >= maxConcurrency) {
      await Promise.race(executing)
    }
  }

  return results
}

export const SUPPORT_EXT = /.(png|jpe?g|gif|svg|webp)$/
