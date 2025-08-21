import type { FileTypeResult } from 'file-type'
import type { Awaitable, Options, UserOptions } from '../types'
import type { FileDataType } from '../utils'

export interface Compressor {
  name: string
  test?: RegExp | ((fileType: FileTypeResult, options?: UserOptions) => boolean)
  compress: (input: ArrayBuffer, fileType: FileTypeResult, options?: Options) => Awaitable<FileDataType>
}

export function defineCompressor(compressor: Compressor | (() => Compressor)): Compressor {
  return typeof compressor === 'function' ? compressor() : compressor
}
