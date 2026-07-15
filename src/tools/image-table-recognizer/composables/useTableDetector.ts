import { ref } from 'vue'

export interface TableCell {
  row: number
  col: number
  text: string
  x: number
  y: number
  width: number
  height: number
}

export interface TableStructure {
  rows: number
  cols: number
  cells: TableCell[]
}

export function useTableDetector() {
  const loading = ref(false)
  const progress = ref(0)
  const error = ref('')

  // 检测表格结构（基于线条检测）
  function detectTable(imageSrc: string): Promise<TableStructure> {
    loading.value = true
    progress.value = 0
    error.value = ''

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('无法获取 Canvas 上下文'))
            return
          }
          ctx.drawImage(img, 0, 0)

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const { width, height, data } = imageData

          progress.value = 30

          // 二值化
          const threshold = 128
          const binary = new Uint8Array(width * height)
          for (let i = 0; i < data.length; i += 4) {
            const idx = i / 4
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
            binary[idx] = avg < threshold ? 1 : 0
          }

          progress.value = 50

          // 检测水平线
          const horizontalLines: number[] = []
          const minLineLength = Math.floor(width * 0.3)
          const lineThreshold = 0.7

          for (let y = 0; y < height; y++) {
            let blackCount = 0
            for (let x = 0; x < width; x++) {
              if (binary[y * width + x] === 1) {
                blackCount++
              }
            }
            if (blackCount / width > lineThreshold && blackCount >= minLineLength) {
              horizontalLines.push(y)
            }
          }

          // 合并相近的水平线
          const mergedHLines: number[] = []
          for (let i = 0; i < horizontalLines.length; i++) {
            if (mergedHLines.length === 0 || horizontalLines[i] - mergedHLines[mergedHLines.length - 1] > 10) {
              mergedHLines.push(horizontalLines[i])
            }
          }

          progress.value = 70

          // 检测垂直线
          const verticalLines: number[] = []
          const minVLineLength = Math.floor(height * 0.3)

          for (let x = 0; x < width; x++) {
            let blackCount = 0
            for (let y = 0; y < height; y++) {
              if (binary[y * width + x] === 1) {
                blackCount++
              }
            }
            if (blackCount / height > lineThreshold && blackCount >= minVLineLength) {
              verticalLines.push(x)
            }
          }

          // 合并相近的垂直线
          const mergedVLines: number[] = []
          for (let i = 0; i < verticalLines.length; i++) {
            if (mergedVLines.length === 0 || verticalLines[i] - mergedVLines[mergedVLines.length - 1] > 10) {
              mergedVLines.push(verticalLines[i])
            }
          }

          progress.value = 90

          // 构建单元格
          const cells: TableCell[] = []
          const rows = mergedHLines.length - 1
          const cols = mergedVLines.length - 1

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              cells.push({
                row: r,
                col: c,
                text: '',
                x: mergedVLines[c],
                y: mergedHLines[r],
                width: mergedVLines[c + 1] - mergedVLines[c],
                height: mergedHLines[r + 1] - mergedHLines[r],
              })
            }
          }

          progress.value = 100
          loading.value = false

          resolve({
            rows,
            cols,
            cells,
          })
        } catch (e: unknown) {
          error.value = e instanceof Error ? e.message : String(e)
          loading.value = false
          reject(e)
        }
      }
      img.onerror = () => {
        error.value = '图片加载失败'
        loading.value = false
        reject(new Error('图片加载失败'))
      }
      img.src = imageSrc
    })
  }

  // 裁剪单元格区域
  function cropCell(imageSrc: string, cell: TableCell): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const padding = 5
        const x = Math.max(0, cell.x - padding)
        const y = Math.max(0, cell.y - padding)
        const w = Math.min(cell.width + padding * 2, img.width - x)
        const h = Math.min(cell.height + padding * 2, img.height - y)

        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法获取 Canvas 上下文'))
          return
        }
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = imageSrc
    })
  }

  return {
    loading,
    progress,
    error,
    detectTable,
    cropCell,
  }
}
