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
      before: kb(source.byteLength),
      after: kb(output.byteLength),
      rate: computedRate(source.byteLength, output.byteLength),
      compressor,
      isReplace,
    })
  }

  fail(id: string, error: Error, compressor?: string): void {
    const err = CompressError.from(error, id)
    if (compressor) {
      err.compressor = compressor
    }
    this.records.push({ success: false, id, error: err })
  }

  printStats(print?: (message: string) => void): void {
    // eslint-disable-next-line no-console
    print ||= console.info

    const { successes, skips, fails, before, after } = this.records.reduce((acc, item) => {
      if (item.success && item.isReplace) {
        acc.before += item.before
        acc.after += item.after
        acc.successes += 1
      }
      else if (item.success && !item.isReplace) {
        acc.skips += 1
      }
      else {
        acc.fails += 1
      }
      return acc
    }, { skips: 0, successes: 0, fails: 0, after: 0, before: 0 })
    const percent = fixed((before - after) / before * 100)
    const isCompleted = this.records.length > 0 && successes > 0
    const isSuccess = isCompleted && fails === 0

    print(`${c.cyan(`[plugin ${PKG_NAME}]`)} - compress images ${isCompleted ? c.green(isSuccess ? 'succeeded' : 'completed') : c.yellow('failed')}`)

    const { outdir } = Context
    const logs = columnify(this.records.map((item) => {
      const file = `${c.dim(outdir)}/${c.green(item.id)}`
      if (item.success) {
        return {
          file,
          reduction: item.rate > 100 ? c.yellow(`↑${item.rate - 100}%`) : c.green(`↓${item.rate}%`),
          compressor: item.compressor,
          size: item.isReplace ? c.dim(`${item.before}kB -> ${item.after}kB`) : c.bold(c.yellow('skipped')),
        }
      }
      return {
        file,
        reduction: `${c.red('error')}`,
        compressor: c.red(item.error.compressor || 'unknown'),
        size: c.red(item.error.message || 'unknown error'),
      }
    }), { columnSplitter: '  ' })

    print(logs)

    if (isCompleted) {
      print('')

      print(`${c.green(`${fixed(before)}kB`)} -> ${c.green(`${fixed(after)}kB`)} ≈ ${c.green(c.bold(`↓${percent}%`))} reduction`)

      const total = [
        `total ${c.blue(`${this.records.length}`)}`,
        `successed ${c.green(`${successes}`)}`,
        `skipped ${c.yellow(`${skips}`)}`,
        `failed ${c.red(`${fails}`)}`,
      ]

      print(total.join(', '))
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
