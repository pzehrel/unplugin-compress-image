import UA from 'user-agents'
import { defineCompressor } from './compressor'

export const _tinypng = defineCompressor({
  test: /\.(png|jpg|jpeg|webp|avif)$/i,
  compress: async (input) => {
    const headers = { 'X-Forwarded-For': randomIpv4(), 'User-Agent': randomUA() }

    const uploadResponse = await fetch('https://tinypng.com/backend/opt/shrink', {
      method: 'POST',
      headers: new Headers(headers),
      duplex: 'half',
      body: input,
    })

    const data = await uploadResponse.json() as UploadResult

    const response = await fetch(data.output.url, {
      method: 'GET',
      headers: new Headers({
        ...headers,
        'Content-Type': 'application/octet-stream',
      }),
    })

    return response.body!
  },
})

interface UploadResult {
  input: { size: number, type: string }
  output: {
    size: number
    type: string
    width: number
    height: number
    ratio: number
    url: string
  }
}

function randomIpv4(): string {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.')
}
function randomUA(): string {
  return new UA().toString()
}
