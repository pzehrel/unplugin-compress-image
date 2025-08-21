import type { FileDataType } from '../compressor'
import { Buffer } from 'node:buffer'

export class CompressError extends Error {
  constructor(message: string, public readonly filePath: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'CompressError'
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
