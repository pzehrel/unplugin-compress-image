import type { FileTypeResult } from 'file-type'
import type { Buffer } from 'node:buffer'
import type { Awaitable, Options, UserOptions } from '../types'

export type SupportType = ArrayBuffer | Buffer

export interface Compressor {
  name: string
  test?: RegExp | ((fileType: FileTypeResult, options?: UserOptions) => boolean)
  compress: (input: ArrayBuffer, fileType: FileTypeResult, options?: Options) => Awaitable<SupportType>
}

export function defineCompressor(compressor: Compressor | (() => Compressor)): Compressor {
  return typeof compressor === 'function' ? compressor() : compressor
}
