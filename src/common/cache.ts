import type { Buffer } from 'node:buffer'
import type { FileDataType } from '../core/types'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'pathe'
import { toUnit8Array } from '../core'

export class CompressCache {
  public readonly dir: string

  constructor(root: string, dir?: string) {
    this.dir = join(root, dir || 'node_modules/.compress-image-cache')
    mkdirSync(this.dir, { recursive: true })
  }

  /**
   * Save compressed file to cache
   * @param source source file md5 or buffer
   * @param compressed compressed file buffer
   */
  save(source: string | FileDataType, compressed: FileDataType): void {
    compressed = toUnit8Array(compressed)
    if (!this.same(source, compressed)) {
      const cacheFile = this.getFilePath(source)
      writeFileSync(cacheFile, compressed)
    }
  }

  /**
   * Get compressed file from cache
   * @param source source file md5 or buffer
   */
  get(source: string | FileDataType): Buffer | undefined {
    const filename = this.md5(source)
    if (!existsSync(join(this.dir, filename))) {
      return undefined
    }
    const filePath = this.getFilePath(source)
    const cacheFile = readFileSync(filePath)
    return cacheFile ? readFileSync(filePath) : undefined
  }

  /**
   * Check if the compressed file is the same as the cached one
   * @param source source file md5 or buffer
   * @param compressed compressed file buffer
   */
  same(source: string | FileDataType, compressed: FileDataType): boolean {
    compressed = toUnit8Array(compressed)
    return this.get(source)?.equals(compressed) ?? false
  }

  /**
   * Check if the cache has the compressed file
   * @param source source file md5 or buffer
   */
  has(source: string | FileDataType): boolean {
    const filename = this.md5(source)
    return existsSync(join(this.dir, filename))
  }

  /**
   * Get the size of the cached compressed file
   * @param source source file md5 or buffer
   */
  size(source: string | Buffer): number {
    return this.get(source)?.byteLength ?? 0
  }

  private md5(file: string | FileDataType): string {
    if (typeof file === 'string') {
      return file
    }
    file = toUnit8Array(file)
    return createHash('md5').update(file).digest('hex')
  }

  private getFilePath(file: string | FileDataType): string {
    return join(this.dir, this.md5(file))
  }
}
