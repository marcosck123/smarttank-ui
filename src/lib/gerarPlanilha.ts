import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Medicao } from '@/types'

export async function gerarPlanilha(medicao: Medicao): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SmartTank'
  const ws = wb.addWorksheet('Medição', { pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true } })

  const dataFormatada = format(new Date(medicao.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

  // ── Larguras de coluna ────────────────────────────────────────────────
  ws.columns = [
    { key: 'tanque',      width: 14 },
    { key: 'tipo',        width: 22 },
    { key: 'comprimento', width: 14 },
    { key: 'altura',      width: 14 },
    { key: 'volume',      width: 16 },
    { key: 'nivel',       width: 10 },
  ]

  // ── Título ────────────────────────────────────────────────────────────
  ws.mergeCells('A1:F1')
  const titulo = ws.getCell('A1')
  titulo.value = 'MEDIÇÃO DE TANQUES — SmartTank'
  titulo.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } }
  titulo.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 30

  // ── Meta ──────────────────────────────────────────────────────────────
  const metaStyle: Partial<ExcelJS.Style> = {
    font: { size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF21262D' } },
  }

  ws.mergeCells('A2:C2'); ws.getCell('A2').value = `Operador: ${medicao.operador}`
  ws.getCell('A2').font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
  ws.getCell('A2').fill = metaStyle.fill!

  ws.mergeCells('D2:F2'); ws.getCell('D2').value = `Data/Hora: ${dataFormatada}`
  ws.getCell('D2').font = { size: 10, color: { argb: 'FFFFFFFF' } }
  ws.getCell('D2').fill = metaStyle.fill!
  ws.getRow(2).height = 20

  // ── Cabeçalho da tabela ───────────────────────────────────────────────
  const headerRow = ws.addRow(['Tanque', 'Combustível', 'Comp. (m)', 'Altura (cm)', 'Volume (L)', 'Nível (%)'])
  headerRow.eachCell(cell => {
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF30363D' } }
    cell.alignment = { horizontal: 'center' }
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF22C55E' } },
    }
  })
  headerRow.height = 18

  // ── Linhas de dados ───────────────────────────────────────────────────
  medicao.leituras.forEach((l, i) => {
    const row = ws.addRow([
      l.nome,
      l.tipo,
      l.comprimentoM,
      parseFloat(l.alturaCm) || 0,
      l.volumeLitros,
      l.percentual / 100,  // formato % no Excel
    ])

    const bgColor = i % 2 === 0 ? 'FF161B22' : 'FF0D1117'
    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      cell.font = { size: 10, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { horizontal: 'center' }
    })
    // Volume em negrito
    row.getCell(5).font = { bold: true, size: 10, color: { argb: 'FF22C55E' } }
    row.getCell(6).numFmt = '0.0%'
    row.height = 17
  })

  // ── Linha de total ────────────────────────────────────────────────────
  const totalLitros = medicao.leituras.reduce((acc, l) => acc + l.volumeLitros, 0)
  ws.addRow([])
  const totalRow = ws.addRow(['', 'TOTAL GERAL', '', '', totalLitros, ''])
  totalRow.eachCell(cell => {
    cell.font = { bold: true, size: 11, color: { argb: 'FF22C55E' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2818' } }
    cell.border = { top: { style: 'medium', color: { argb: 'FF22C55E' } } }
    cell.alignment = { horizontal: 'center' }
  })
  totalRow.height = 20

  // ── Observações ───────────────────────────────────────────────────────
  if (medicao.observacoes) {
    ws.addRow([])
    ws.addRow(['Observações:'])
    const obsRow = ws.addRow([medicao.observacoes])
    ws.mergeCells(`A${obsRow.number}:F${obsRow.number}`)
    obsRow.getCell(1).font = { size: 10, italic: true, color: { argb: 'FFADB5BD' } }
    obsRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF161B22' } }
    obsRow.getCell(1).alignment = { wrapText: true }
    obsRow.height = 40
  }

  // ── Download ──────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `medicao_${format(new Date(medicao.dataHora), 'yyyyMMdd_HHmm')}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
