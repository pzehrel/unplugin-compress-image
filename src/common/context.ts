import type { Options } from '../types'
import { initCompressors } from '../compressor'
import { CompressCache } from './cache'
import { CompressLogger } from './logger'

interface ContextConfig {
  options?: Options
  root: string
  outdir: string
}

export class Context {
  public static options?: Options
  public static root: string
  public static outdir: string

  public static cache?: CompressCache | null = null
  public static logger: CompressLogger | null = null

  private constructor() {}

  static async create(config: ContextConfig): Promise<void> {
    this.options = config.options
    this.root = config.root
    this.outdir = config.outdir
    if (config.options?.logger !== false) {
      this.logger = new CompressLogger(config.options?.logger)
    }
    if (config.options?.cache !== false) {
      this.cache = new CompressCache(config.root, config.options?.cache?.dir)
    }
    await initCompressors(this.options)
  }
}
