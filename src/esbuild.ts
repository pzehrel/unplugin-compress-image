import { createEsbuildPlugin } from 'unplugin'
import { unpluginCompressImageFactory } from '.'

export default createEsbuildPlugin(unpluginCompressImageFactory)
