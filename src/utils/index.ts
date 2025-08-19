import { Buffer } from 'node:buffer'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

export async function writeFileFromArrayBuffer(filePath: string, file: ArrayBuffer): Promise<void> {
  mkdirSync(basename(filePath), { recursive: true })
  await writeFile(filePath, toBuffer(file))
}

export type FileDataType = Buffer | ArrayBuffer | Uint8Array

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

export function isFileDataType(file: any): file is FileDataType {
  return file instanceof Buffer || file instanceof ArrayBuffer
}

export class CompressError extends Error {
  constructor(message: string, public readonly filePath: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'CompressError'
  }
}
