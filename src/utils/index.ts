import type { FileDataType } from '../compressor'
import { Buffer } from 'node:buffer'
import { cpus } from 'node:os'

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

export function toBuffer(file: FileDataType): Buffer {
  if (file instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(file))
  }

  if (file instanceof Uint8Array) {
    return Buffer.from(file)
  }
  return file
}

export function toArrayBuffer(file: FileDataType): ArrayBuffer {
  if (file instanceof Buffer || file instanceof Uint8Array) {
    return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer
  }
  return file
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
