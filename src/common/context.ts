import type { Options } from '../types'
import { initCompressors } from '../compressor'
import { CompressLogger } from './logger'

interface ContextConfig {
  options?: Options
  root: string
  dist: string
}

export class Context {
  public static options?: Options
  public static root: string
  public static dist: string
  public static logger: CompressLogger | null = null

  private constructor() {}

  static create(config: ContextConfig): void {
    Context.options = config.options
    Context.root = config.root
    Context.dist = config.dist
    initCompressors(Context.options)

    if (config.options?.logger !== false) {
      Context.logger = new CompressLogger()
    }
  }
}
