export interface VisitRecord {
  path: string
  name: string
  timestamp: number
}

const STORAGE_KEY = 'web_tool_visits'
const MAX_RECORDS = 5000

function isSameDay(a: number, b: number) {
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate()
}

export function getVisits(): VisitRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as VisitRecord[]) : []
  }
  catch {
    return []
  }
}

export function recordVisit(path: string, name: string) {
  if (typeof window === 'undefined') return
  try {
    const visits = getVisits()
    visits.push({ path, name, timestamp: Date.now() })
    if (visits.length > MAX_RECORDS) visits.splice(0, visits.length - MAX_RECORDS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits))
  }
  catch {
    // ignore storage errors
  }
}

export interface VisitStats {
  total: number
  today: number
  uniqueTools: number
  topTools: { path: string; name: string; count: number }[]
  recent: VisitRecord[]
}

export function getVisitStats(): VisitStats {
  const visits = getVisits()
  const now = Date.now()
  const today = visits.filter(v => isSameDay(v.timestamp, now)).length

  const toolMap = new Map<string, { name: string; count: number }>()
  visits.forEach((v) => {
    if (v.path === '/') return
    const existing = toolMap.get(v.path)
    if (existing) {
      existing.count += 1
    }
    else {
      toolMap.set(v.path, { name: v.name || v.path, count: 1 })
    }
  })

  const topTools = Array.from(toolMap.entries())
    .map(([path, { name, count }]) => ({ path, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    total: visits.length,
    today,
    uniqueTools: toolMap.size,
    topTools,
    recent: visits.slice(-20).reverse(),
  }
}
