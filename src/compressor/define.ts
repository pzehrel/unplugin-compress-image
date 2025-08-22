import type { FileTypeResult } from 'file-type'
import type { Buffer } from 'node:buffer'
import type { Awaitable, Options } from '../types'

export type FileDataType = Buffer | ArrayBuffer | Uint8Array

export interface Compressor {
  name: string
  test?: RegExp | ((fileType: FileTypeResult, options?: Options) => boolean)
  compress: (input: ArrayBuffer, fileType: FileTypeResult, options?: Options) => Promise<FileDataType | false>
}

export function defineCompressor(compressor: Compressor | (() => Compressor)): Compressor {
  return typeof compressor === 'function' ? compressor() : compressor
}
