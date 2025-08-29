import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { fileTypeFromBuffer } from 'file-type'
import { runCompressorsByBestSize } from '../../dist/compressor'

import { toArrayBuffer, toBase64, toBuffer } from '../utils'

(async () => {
  // const file = readFileSync(resolve(import.meta.dirname, '../../playground/1.png'))
  // const base64 = await toBase64(file, { ext: 'png', mime: 'image/png' })
  const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFkAAAC8CAIAAACc4JXJAAAACXBIWXMAAAsTAAALEwEAmpwYAAABU0lEQVR4nO3QMRHAMADEsG/5c05HQ2gGCYHPzzlnbNvevwMu4kW8iBfxIl7Ei3gRL+JFvIgX8SJexIt4ES/iRbyIF/EiXsSLeBEv4kW8iBfxIl7Ei3gRL+JFvIgX8SJexIt4ES/iRbyIF/EiXsSLeBEv4kW8iBfxIl7Ei3gRL+JFvIgX8SJexIt4ES/iRbyIF/EiXsSLeBEv4kW8iBfxIl7Ei3gRL+JFvIgX8SJexIt4ES/iRbyIF/EiXsSLeBEv4kW8iBfxIl7Ei3gRL+JFvIgX8SJexIt4ES/iRbyIF/EiXsSLeBEv4kW8iBfxIl7Ei3gRL+JFvIgX8SJexIt4ES/iRbyIF/EiXsSLeBEv4kW8iBfxIl7Ei3gRL+JFvIgX8SJexIt4ES/iRbyIF/EiXsSLeBEv4kW8iBfxIl7Ei3gRL+JFvIgX8SJexIt4ES/iRbzIB5QZBHXa7+NdAAAAAElFTkSuQmCC'

  // runCompressorsByBestSize(base64, {}).then(console.log)

  const buffer = toArrayBuffer(base64)

  fileTypeFromBuffer(buffer).then(console.log)
})()
