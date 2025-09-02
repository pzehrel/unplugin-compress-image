import type { compress } from '../compressor'
import type { Options } from '../types'
import c from 'ansi-colors'
import { name as PKG_NAME } from '../../package.json'
import { CompressError } from '../utils'

interface Success {
  success: true
  id: string
  before: number
  after: number
  rate: number
  compressor: string
  isReplace: boolean
}
interface Fail {
  success: false
  id: string
  error: CompressError
}

export class CompressLogger {
  private constructor() {}
  public static get instance(): CompressLogger | null {
    return this._instance
  }

  private static _instance: CompressLogger | null = null

  static createFromOptions(options?: Options): void {
    if (options?.logger === false) {
      return undefined
    }
    if (!this._instance) {
      this._instance = new CompressLogger()
    }
  }

  private records: (Success | Fail)[] = []
  private successCount = 0
  private failCount = 0

  add(result: Awaited<ReturnType<typeof compress>>): void {
    if (!result.data) {
      this.fail(result.id, new Error('no compression data'))
      return
    }
    if (result.data instanceof CompressError) {
      this.fail(result.id, result.data, result.data.compressor)
      return
    }

    // compress js/css code
    if ('replaces' in result.data) {
      result.data.replaces.forEach(({ replaceId, best, error }) => {
        if (best) {
          this.success(replaceId, best.source, best.compressed, best.compressor.name, best.isSmallerThanSourceFile)
        }
        else {
          this.fail(replaceId, error || new Error('no compression data'), error?.compressor)
        }
      })
    }

    // asset file success
    else {
      this.success(result.id, result.data.source, result.data.compressed!, result.data.compressor.name, result.data.isSmallerThanSourceFile)
    }
  }

  success(id: string, source: Uint8Array, output: Uint8Array, compressor: string, isReplace: boolean): void {
    this.records.push({
      success: true,
      id,
      before: source.byteLength,
      after: output.byteLength,
      rate: computedRate(source.byteLength, output.byteLength),
      compressor,
      isReplace,
    })
    this.successCount += 1
  }

  fail(id: string, error: Error, compressor?: string): void {
    const err = CompressError.from(error, id)
    if (compressor) {
      err.compressor = compressor
    }
    this.records.push({ success: false, id, error: err })
    this.failCount += 1
  }

  printStats(print: (message: string) => void): void {
    // eslint-disable-next-line no-console
    print ||= console.info

    const total = this.successCount + this.failCount
    const { before, after } = this.records.reduce((acc, item) => {
      if (item.success) {
        acc.before += item.before
        acc.after += item.after
      }
      return acc
    }, { before: 0, after: 0 })
    const percent = fixed((before - after) / before * 100)

    const isCompleted = total > 0 && this.successCount > 0
    const isSuccess = isCompleted && this.failCount === 0

    print(`${c.cyan(`[plugin ${PKG_NAME}]`)} - compress images ${isCompleted ? c.green(isSuccess ? 'succeeded' : 'completed') : c.yellow('failed')}`)

    if (isCompleted) {
      print('')

      const percentText = percent >= 1 ? c.yellow(`${percent}%`) : c.green(`${percent}%`)
      print(`total savings ${c.green(`${kb(before)}kB`)} -> ${c.green(`${kb(after)}kB`)} ≈ ${c.bold(`${percentText}`)} reduction`)
    }
  }
}

function kb(size: number): number {
  return fixed((size / 1024))
}

function fixed(num: number, d = 2): number {
  return Number(num.toFixed(d))
}

function computedRate(before: number, after: number): number {
  return fixed((before - after) / before * 100)
}
