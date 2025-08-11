import type { FileTypeResult } from 'file-type'
import type { Buffer } from 'node:buffer'
import type { Readable } from 'node:stream'
import type { Awaitable, Options } from '../types'

export type FileData = Uint8Array | ArrayBuffer | Buffer | Readable | ReadableStream

export interface Compressor {
  test?: RegExp | ((fileType: FileTypeResult) => boolean)
  compress: (input: Readable, fileType: FileTypeResult, options?: Options) => Awaitable<FileData>
}

export function defineCompressor(compressor: Compressor): Compressor {
  return compressor
}

export function compressorCanUse(compressor: Compressor, fileType: FileTypeResult): boolean {
  if (compressor.test) {
    if (typeof compressor.test === 'function') {
      return compressor.test(fileType)
    }
    return compressor.test.test(fileType.ext)
  }
  return true
}
