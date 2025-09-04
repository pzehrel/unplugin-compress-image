import type { Base64, FileDataType } from '../types'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'pathe'
import { toUnit8Array } from '../utils'

export class CompressCache {
  public readonly dir: string
  constructor(root: string, dir?: string) {
    this.dir = join(root, dir || 'node_modules/.compress-image-cache')
    mkdirSync(this.dir, { recursive: true })
  }

  get(key: FileDataType | Base64): Uint8Array | undefined {
    const filename = toMd5(key)
    const filePath = join(this.dir, filename)
    if (existsSync(filePath)) {
      return readFileSync(filePath)
    }
  }

  set(key: FileDataType | Base64, asset: Uint8Array): void {
    const filename = toMd5(key)
    const filePath = join(this.dir, filename)
    writeFileSync(filePath, asset)
  }

  has(key: FileDataType | Base64): boolean {
    const filename = toMd5(key)
    const filePath = join(this.dir, filename)
    return existsSync(filePath)
  }
}

function toMd5(value: FileDataType | Base64): string {
  value = toUnit8Array(value)
  return createHash('md5').update(value).digest('hex')
}
