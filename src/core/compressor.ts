import type { Buffer } from 'node:buffer'
import type { ReadStream } from 'node:fs'
import type { Options } from '../types'

export interface Input {
  filepath: string
  filename: string
  file: ReadStream
  mimeType: string
  onProgress: (progress: number) => void
}

export interface Output {
  file: URL | Buffer | ReadableStream<any>
}

export interface Compressor {
  (input: Input, options: Options): Output | Promise<Output>
}
