import type { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'pathe'

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
  save(source: string | Buffer, compressed: Buffer): void {
    if (!this.same(source, compressed)) {
      const cacheFile = this.getFilePath(source)
      writeFileSync(cacheFile, compressed)
    }
  }

  /**
   * Get compressed file from cache
   * @param source source file md5 or buffer
   */
  get(source: string | Buffer): Buffer | undefined {
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
  same(source: string | Buffer, compressed: Buffer): boolean {
    return this.get(source)?.equals(compressed) ?? false
  }

  /**
   * Check if the cache has the compressed file
   * @param source source file md5 or buffer
   */
  has(source: string | Buffer): boolean {
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

  private md5(file: string | Buffer): string {
    if (typeof file === 'string') {
      return file
    }
    return createHash('md5').update(file).digest('hex')
  }

  private getFilePath(file: string | Buffer): string {
    return join(this.dir, this.md5(file))
  }
}
