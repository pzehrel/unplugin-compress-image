import type { FileData } from '../compressor/compressor'
import { Buffer } from 'node:buffer'
import { writeFile } from 'node:fs/promises'
import { Readable } from 'node:stream'

export function saveToFile(output: Buffer, filePath: string): Promise<void> {
  return writeFile(filePath, output)
}

export function toReadable(output: FileData): Readable {
  // 如果是 Web ReadableStream，转换为 Node.js Readable
  if (output instanceof ReadableStream) {
    return Readable.fromWeb(output)
  }

  // 如果是 ArrayBuffer，先转换为 Uint8Array
  if (output instanceof ArrayBuffer) {
    return Readable.from(new Uint8Array(output))
  }

  // 如果是 Uint8Array 或 Buffer，创建 Readable 流
  if (output instanceof Uint8Array || Buffer.isBuffer(output)) {
    return Readable.from(output)
  }
  return output
}

export function toBuffer<T extends FileData>(output: T): T extends Readable | ReadableStream ? Promise<Buffer> : Buffer {
  if (output instanceof Uint8Array) {
    return Buffer.from(output) as any
  }
  if (output instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(output)) as any
  }

  if (output instanceof ReadableStream) {
    output = Readable.fromWeb(output) as any
  }

  if (output instanceof Readable) {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      output.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      })
      output.on('end', () => resolve(Buffer.concat(chunks)))
      output.on('error', reject)
    }) as any
  }
  return output as any
}

export class CompressError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CompressError'
  }
}
