import { createVitePlugin } from 'unplugin'
import { unpluginCompressImageFactory } from '.'

export default createVitePlugin(unpluginCompressImageFactory)
