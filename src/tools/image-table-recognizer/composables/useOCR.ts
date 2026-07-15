import { ref } from 'vue'

export interface OCRResult {
  text: string
  confidence: number
  words: Array<{
    text: string
    confidence: number
    bbox: { x0: number; y0: number; x1: number; y1: number }
  }>
}

export function useOCR() {
  const loading = ref(false)
  const progress = ref(0)
  const error = ref('')

  async function recognize(imageSrc: string, lang: string = 'chi_sim+eng'): Promise<OCRResult> {
    loading.value = true
    progress.value = 0
    error.value = ''

    try {
      // 懒加载 tesseract.js
      const Tesseract = await import('tesseract.js')

      const result = await Tesseract.recognize(imageSrc, lang, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            progress.value = Math.round(m.progress * 100)
          }
        },
      })

      loading.value = false
      progress.value = 100

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        words: (result.data as any).words.map((w: any) => ({
          text: w.text,
          confidence: w.confidence,
          bbox: w.bbox,
        })),
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
    recognize,
  }
}
