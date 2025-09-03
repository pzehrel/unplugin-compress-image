import type { Options } from '../types'
import { initCompressors } from '../compressor'
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
  public static logger: CompressLogger | null = null

  private constructor() {}

  static async create(config: ContextConfig): Promise<void> {
    Context.options = config.options
    Context.root = config.root
    Context.outdir = config.outdir
    if (config.options?.logger !== false) {
      Context.logger = new CompressLogger()
    }
    await initCompressors(Context.options)
  }
}
