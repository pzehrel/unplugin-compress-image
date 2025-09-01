import type { FileTypeResult } from 'file-type'
import type { Base64, Code, FileDataType } from '../types'
import { Buffer } from 'node:buffer'
import MagicString from 'magic-string'

export * from './error'

export function isBinary(data: unknown): data is Uint8Array | ArrayBuffer {
  return data instanceof Uint8Array || data instanceof ArrayBuffer
}

export function isCode(data: unknown): data is Code {
  return !isBase64(data) && (typeof data === 'string' || data instanceof MagicString)
}

export function isBase64(data: unknown): data is Base64 {
  return typeof data === 'string' && /^data:\w+\/[a-zA-Z+\-.]+;base64,.*/.test(data)
}

export function getBase64FileType(data: Base64): FileTypeResult | null {
  const match = data.match(/^data:(\w+)\/([a-zA-Z+\-.]+);base64,.*/)
  if (match) {
    const [, mime, ext] = match
    return { mime, ext }
  }
  return null
}

export function removeBase64Meta(data: Base64): string {
  return data.replace(/^data:\w+\/[a-zA-Z+\-.]+;base64,/, '')
}

export function toUnit8Array(data: FileDataType): Uint8Array {
  if (isBase64(data)) {
    return Uint8Array.from(Buffer.from(removeBase64Meta(data), 'base64'))
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  }

  return data
}

export function toArrayBuffer(data: FileDataType): ArrayBuffer {
  if (isBase64(data)) {
    return Buffer.from(removeBase64Meta(data), 'base64').buffer
  }

  if (data instanceof Uint8Array) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
  }

  return data
}

export function toBase64(data: FileDataType): Base64 {
  if (data instanceof Uint8Array) {
    return Buffer.from(data).toString('base64')
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(data)).toString('base64')
  }

  return data
}

export function computedRate(beforeSize: number, afterSize: number): number {
  const rate = (beforeSize - afterSize) / beforeSize
  return Number.isNaN(rate) ? 1 : rate
}

export const _contextUtils = {
  toArrayBuffer,
  toBase64,
  toUnit8Array,
}
