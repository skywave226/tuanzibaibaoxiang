export interface TableCell {
  row: number
  col: number
  text: string
}

export function useTableExporter() {
  // 导出为 CSV
  function exportToCSV(cells: TableCell[], filename: string = 'table.csv') {
    if (cells.length === 0) return

    const maxRow = Math.max(...cells.map(c => c.row))
    const maxCol = Math.max(...cells.map(c => c.col))

    const rows: string[][] = []
    for (let r = 0; r <= maxRow; r++) {
      const row: string[] = []
      for (let c = 0; c <= maxCol; c++) {
        const cell = cells.find(cell => cell.row === r && cell.col === c)
        row.push(cell?.text || '')
      }
      rows.push(row)
    }

    const csvContent = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, filename)
  }

  async function exportToExcel(cells: TableCell[], filename: string = 'table.xlsx') {
    if (cells.length === 0) return

    const XLSX = await import('xlsx')

    const maxRow = Math.max(...cells.map(c => c.row))
    const maxCol = Math.max(...cells.map(c => c.col))

    const data: string[][] = []
    for (let r = 0; r <= maxRow; r++) {
      const row: string[] = []
      for (let c = 0; c <= maxCol; c++) {
        const cell = cells.find(cell => cell.row === r && cell.col === c)
        row.push(cell?.text || '')
      }
      data.push(row)
    }

    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '表格')
    XLSX.writeFile(wb, filename)
  }

  // 导出为 HTML
  function exportToHTML(cells: TableCell[], filename: string = 'table.html') {
    if (cells.length === 0) return

    const maxRow = Math.max(...cells.map(c => c.row))
    const maxCol = Math.max(...cells.map(c => c.col))

    let html = '<table border="1" style="border-collapse: collapse;">\n'
    for (let r = 0; r <= maxRow; r++) {
      html += '  <tr>\n'
      for (let c = 0; c <= maxCol; c++) {
        const cell = cells.find(cell => cell.row === r && cell.col === c)
        html += `    <td style="padding: 8px;">${cell?.text || ''}</td>\n`
      }
      html += '  </tr>\n'
    }
    html += '</table>'

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
    downloadBlob(blob, filename)
  }

  // 导出为 Markdown
  function exportToMarkdown(cells: TableCell[], filename: string = 'table.md') {
    if (cells.length === 0) return

    const maxRow = Math.max(...cells.map(c => c.row))
    const maxCol = Math.max(...cells.map(c => c.col))

    let md = ''
    for (let r = 0; r <= maxRow; r++) {
      const row: string[] = []
      for (let c = 0; c <= maxCol; c++) {
        const cell = cells.find(cell => cell.row === r && cell.col === c)
        row.push(cell?.text || '')
      }
      md += '| ' + row.join(' | ') + ' |\n'
      if (r === 0) {
        md += '| ' + row.map(() => '---').join(' | ') + ' |\n'
      }
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' })
    downloadBlob(blob, filename)
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    exportToCSV,
    exportToExcel,
    exportToHTML,
    exportToMarkdown,
  }
}
