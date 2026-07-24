import { useMessage } from 'naive-ui'

export function useCopy(successText = '已复制', emptyText = '没有可复制的内容') {
  const message = useMessage()

  async function copy(text: string | number | undefined | null) {
    const value = text === undefined || text === null ? '' : String(text)
    if (!value) {
      message.warning(emptyText)
      return false
    }
    try {
      await navigator.clipboard.writeText(value)
      message.success(successText)
      return true
    }
    catch (err) {
      message.error('复制失败，请手动复制')
      return false
    }
  }

  return { copy }
}
