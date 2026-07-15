import { ref } from 'vue'

export interface ProcessedImage {
  original: string
  processed: string
  width: number
  height: number
}

export function useImageProcessor() {
  const loading = ref(false)
  const progress = ref(0)
  const error = ref('')

  // 图片转 Canvas
  function imageToCanvas(imageSrc: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法获取 Canvas 上下文'))
          return
        }
        ctx.drawImage(img, 0, 0)
        resolve(canvas)
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = imageSrc
    })
  }

  // 灰度化
  function grayscale(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      data[i] = avg
      data[i + 1] = avg
      data[i + 2] = avg
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas
  }

  // 二值化
  function binarize(canvas: HTMLCanvasElement, threshold = 128): HTMLCanvasElement {
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      const value = avg > threshold ? 255 : 0
      data[i] = value
      data[i + 1] = value
      data[i + 2] = value
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas
  }

  // 处理图片
  async function processImage(imageSrc: string): Promise<ProcessedImage> {
    loading.value = true
    progress.value = 0
    error.value = ''

    try {
      progress.value = 20
      const canvas = await imageToCanvas(imageSrc)

      progress.value = 40
      grayscale(canvas)

      progress.value = 60
      binarize(canvas)

      progress.value = 100
      loading.value = false

      return {
        original: imageSrc,
        processed: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
      loading.value = false
      throw e
    }
  }

  return {
    loading,
    progress,
    error,
    processImage,
  }
}
