import type { WebpackCompiler } from 'unplugin'
import type { Options } from '../types'
import url from 'node:url'
import { name as PKG_NAME } from '../../package.json'
import { Context } from '../common'

export function createWebpackPlugin(options: Options | undefined): (compiler: WebpackCompiler) => void {
  return (compiler) => {
    // Only enable in build mode
    if (compiler.options.mode !== 'production') {
      return
    }

    compiler.hooks.run.tapPromise(PKG_NAME, async () => {
      await Context.create({
        root: compiler.context,
        outdir: compiler.options.output.path || 'dist',
        options,
      })
    })

    // compiler.webpack.version

    // support webpack 4
    compiler.hooks.compilation.tap(PKG_NAME, async (compilation) => {
      compiler.webpack.NormalModule.getCompilationHooks(compilation).loader.tap(PKG_NAME, (_, module) => {
        // Using a loader to compress resource files ensures that the resource files are compressed before being processed by other loaders.
        if (/\.(?:png|jpe?g|gif|webp|avif|svg)$/i.test(module.resource)) {
          const loaderUrl = url.fileURLToPath(new URL('../dist/webpack-loader.cjs', import.meta.url))
          // The execution order of loaders is stack-based (last-in, first-out).
          module.loaders.push({ loader: loaderUrl })
        }
      })
    })

    // compiler.webpack.version
    // TODO: support webpack 5, referenced "image-minimizer-webpack-plugin"

    const done = compiler.hooks.afterDone || compiler.hooks.done
    done.tap(PKG_NAME, () => {
      Context.logger?.printTotal()
    })
  }
}
