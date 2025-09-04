import type { compress } from '../compressor'
import c from 'ansi-colors'
import columnify from 'columnify'
import { name as PKG_NAME } from '../../package.json'
import { CompressError } from '../utils'
import { Context } from './context'

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

    // Compress JS/CSS code
    if ('replaces' in result.data) {
      result.data.replaces.forEach(({ replaceId, best, error }) => {
        if (best) {
          const compressor = typeof best.compressor === 'string' ? best.compressor : best.compressor.name
          this.success(replaceId, best.source, best.compressed, compressor, best.isSmallerThanSourceFile)
        }
        else {
          this.fail(replaceId, error || new Error('no compression data'), error?.compressor)
        }
      })
    }

    // Asset file success
    else {
      const compressor = typeof result.data.compressor === 'string' ? result.data.compressor : result.data.compressor.name
      this.success(result.id, result.data.source, result.data.compressed!, compressor, result.data.isSmallerThanSourceFile)
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

  printStats(print?: (message: string) => void): void {
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

    const { outdir } = Context
    const logs = columnify(this.records.map((item) => {
      const File = `${c.dim(outdir)}/${c.green(item.id)}`
      if (item.success) {
        return {
          File,
          Reduction: item.rate > 1 ? c.yellow(`${item.rate}%`) : c.green(`${item.rate}%`),
          Compressor: item.compressor,
          Status: item.isReplace ? c.green('replaced') : c.yellow('skipped'),
        }
      }
      return {
        File,
        Reduction: `${c.red('error')}`,
        Compressor: c.red(item.error.compressor || 'unknown'),
        Status: c.red(item.error.message || 'unknown error'),
      }
    }))

    print(logs)

    if (isCompleted) {
      print('')

      const percentText = percent >= 1 ? c.yellow(`${percent}%`) : c.green(`${percent}%`)
      print(`total compress ${c.green(`${kb(before)}kB`)} -> ${c.green(`${kb(after)}kB`)} ≈ ${c.bold(`${percentText}`)} reduction`)

      const skips = this.records.filter(i => i.success && !i.isReplace)
      const successes = this.records.filter(i => i.success && i.isReplace)
      print(`success ${c.green(`${successes.length}`)}; skipped ${c.yellow(`${skips.length}`)}; failed ${c.red(`${this.failCount}`)}; total ${c.bold(`${total}`)}`)
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
