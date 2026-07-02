export interface Frame {
  index: number
  timestamp: number
  dataUrl: string
  canvas: HTMLCanvasElement
}

export async function extractFrames(
  source: HTMLVideoElement | HTMLImageElement,
  options: { intervalMs?: number; maxFrames?: number } = {}
): Promise<Frame[]> {
  const { intervalMs = 100, maxFrames = 30 } = options
  const frames: Frame[] = []

  if (source instanceof HTMLImageElement) {
    const canvas = document.createElement('canvas')
    canvas.width = source.naturalWidth || source.width
    canvas.height = source.naturalHeight || source.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
    frames.push({
      index: 0,
      timestamp: 0,
      dataUrl: canvas.toDataURL('image/png'),
      canvas,
    })
    return frames
  }

  const video = source
  const duration = video.duration
  if (!duration || !isFinite(duration)) return frames

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!

    let frameIndex = 0
    const totalFrames = Math.min(Math.floor(duration * 1000 / intervalMs), maxFrames)

    function seekAndCapture() {
      if (frameIndex >= totalFrames) {
        video.removeEventListener('seeked', seekAndCapture)
        resolve(frames)
        return
      }

      video.currentTime = (frameIndex * intervalMs) / 1000
    }

    video.addEventListener('seeked', () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      frames.push({
        index: frameIndex,
        timestamp: frameIndex * intervalMs,
        dataUrl: canvas.toDataURL('image/png'),
        canvas: canvas, // 注意：同一个 canvas 引用，后续帧会覆盖
      })
      frameIndex++
      seekAndCapture()
    })

    seekAndCapture()
  })
}

export function extractFramesFromBlob(blob: Blob, options?: { intervalMs?: number; maxFrames?: number }): Promise<Frame[]> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const video = document.createElement('video')
    video.muted = true
    video.preload = 'auto'

    video.addEventListener('loadeddata', async () => {
      const frames = await extractFrames(video, options)
      URL.revokeObjectURL(url)
      resolve(frames)
    })

    video.src = url
  })
}
