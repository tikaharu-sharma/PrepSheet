import * as XLSX from 'xlsx'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

export interface MonthlyReportExportRow {
  dateLabel: string
  lunchPersons: number | null
  lunchSale: number
  dinnerPersons: number | null
  dinnerSale: number
  totalPersons: number
  totalSale: number
  grandTotalSale: number
  creditSale: number
  tax10Sale: number
  tax10Amount: number
  totalShopping: number
}

export interface MonthlyReportExportTotals {
  lunchPersons: number
  lunchSale: number
  dinnerPersons: number
  dinnerSale: number
  totalPersons: number
  totalSale: number
  grandTotalSale: number
  creditSale: number
  tax10Sale: number
  tax10Amount: number
  totalShopping: number
}

type PdfMakeWithVfs = typeof pdfMake & {
  vfs?: Record<string, string>
}

type PdfTableCell = string | { text: string; style?: string; alignment?: 'left' | 'center' | 'right'; colSpan?: number }

const pdfMakeWithVfs = pdfMake as PdfMakeWithVfs
const pdfFontVfs = pdfFonts as { pdfMake?: { vfs?: Record<string, string> }; vfs?: Record<string, string> }

if (!pdfMakeWithVfs.vfs) {
  pdfMakeWithVfs.vfs = pdfFontVfs.pdfMake?.vfs ?? pdfFontVfs.vfs ?? {}
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value)


const formatPdfCurrency = (value: number) => formatCurrency(value)

const buildPdfBody = (rows: MonthlyReportExportRow[], totals: MonthlyReportExportTotals): PdfTableCell[][] => [
  [
    { text: 'DATE', style: 'tableHeader' },
    { text: 'L', style: 'tableHeader' },
    { text: 'LUNCH', style: 'tableHeader' },
    { text: 'D', style: 'tableHeader' },
    { text: 'DINNER', style: 'tableHeader' },
    { text: 'T', style: 'tableHeader' },
    { text: 'TOTAL', style: 'tableHeader' },
    { text: 'GRAND TOTAL', style: 'tableHeader' },
    { text: 'CREDIT', style: 'tableHeader' },
    { text: '10% TAX', style: 'tableHeader' },
    { text: '10% TAX AMOUNT', style: 'tableHeader' },
    { text: 'TOTAL SHOPPING', style: 'tableHeader' },
  ],
  [
    { text: '', style: 'tableSubHeader' },
    { text: 'P', style: 'tableSubHeader' },
    { text: 'SALE', style: 'tableSubHeader' },
    { text: 'P', style: 'tableSubHeader' },
    { text: 'SALE', style: 'tableSubHeader' },
    { text: 'P', style: 'tableSubHeader' },
    { text: 'SALE', style: 'tableSubHeader' },
    { text: 'SALE', style: 'tableSubHeader' },
    { text: 'SALE', style: 'tableSubHeader' },
    { text: 'SALE', style: 'tableSubHeader' },
    { text: 'AMOUNT', style: 'tableSubHeader' },
    { text: 'SHOPPING', style: 'tableSubHeader' },
  ],
  ...rows.map((row) => [
    { text: row.dateLabel, style: 'bodyCell' },
    { text: row.lunchPersons === null ? '' : String(row.lunchPersons), style: 'numberCell' },
    { text: formatPdfCurrency(row.lunchSale), style: 'numberCell' },
    { text: row.dinnerPersons === null ? '' : String(row.dinnerPersons), style: 'numberCell' },
    { text: formatPdfCurrency(row.dinnerSale), style: 'numberCell' },
    { text: String(row.totalPersons), style: 'numberCell' },
    { text: formatPdfCurrency(row.totalSale), style: 'numberCell' },
    { text: formatPdfCurrency(row.grandTotalSale), style: 'numberCell' },
    { text: formatPdfCurrency(row.creditSale), style: 'numberCell' },
    { text: formatPdfCurrency(row.tax10Sale), style: 'numberCell' },
    { text: formatPdfCurrency(row.tax10Amount), style: 'numberCell' },
    { text: formatPdfCurrency(row.totalShopping), style: 'numberCell' },
  ]),
  [
    { text: 'TOTAL', style: 'totalLabel' },
    { text: String(totals.lunchPersons), style: 'totalNumber' },
    { text: formatPdfCurrency(totals.lunchSale), style: 'totalNumber' },
    { text: String(totals.dinnerPersons), style: 'totalNumber' },
    { text: formatPdfCurrency(totals.dinnerSale), style: 'totalNumber' },
    { text: String(totals.totalPersons), style: 'totalNumber' },
    { text: formatPdfCurrency(totals.totalSale), style: 'totalNumber' },
    { text: formatPdfCurrency(totals.grandTotalSale), style: 'totalNumber' },
    { text: formatPdfCurrency(totals.creditSale), style: 'totalNumber' },
    { text: formatPdfCurrency(totals.tax10Sale), style: 'totalNumber' },
    { text: formatPdfCurrency(totals.tax10Amount), style: 'totalNumber' },
    { text: formatPdfCurrency(totals.totalShopping), style: 'totalNumber' },
  ],
]

const buildPdfDefinition = (params: {
  title: string
  monthLabel: string
  rows: MonthlyReportExportRow[]
  totals: MonthlyReportExportTotals
}) => ({
  pageSize: 'A4',
  pageOrientation: 'landscape',
  pageMargins: [20, 20, 20, 20] as [number, number, number, number],
  content: [
    { text: params.title, style: 'title' },
    { text: params.monthLabel, style: 'subtitle' },
    {
      table: {
        headerRows: 2,
        widths: [66, 24, 52, 24, 52, 24, 58, 70, 58, 58, 72, 68],
        body: buildPdfBody(params.rows, params.totals),
      },
      layout: {
        fillColor: (rowIndex: number) => {
          if (rowIndex === 0 || rowIndex === 1) return '#f7f7f7'
          if (rowIndex === params.rows.length + 2) return '#fafafa'
          return null
        },
      },
    },
  ],
  defaultStyle: {
    font: 'Roboto',
    fontSize: 8,
  },
  styles: {
    title: {
      bold: true,
      fontSize: 20,
      alignment: 'center' as const,
      margin: [0, 0, 0, 4] as [number, number, number, number],
    },
    subtitle: {
      fontSize: 11,
      alignment: 'center' as const,
      margin: [0, 0, 0, 10] as [number, number, number, number],
    },
    tableHeader: {
      bold: true,
      alignment: 'center' as const,
      fontSize: 8,
    },
    tableSubHeader: {
      bold: true,
      alignment: 'center' as const,
      fontSize: 8,
    },
    bodyCell: {
      fontSize: 8,
    },
    numberCell: {
      alignment: 'right' as const,
      fontSize: 8,
    },
    totalLabel: {
      bold: true,
      fontSize: 8,
    },
    totalNumber: {
      bold: true,
      alignment: 'right' as const,
      fontSize: 8,
    },
  },
})

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const appendRow = (sheet: XLSX.WorkSheet, rowIndex: number, values: Array<string | number | null>) => {
  values.forEach((value, columnIndex) => {
    if (value === null || value === '') {
      return
    }

    const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })
    sheet[address] =
      typeof value === 'number'
        ? { t: 'n', v: value }
        : { t: 's', v: value }
  })
}

const setRange = (sheet: XLSX.WorkSheet, rowCount: number, columnCount: number) => {
  sheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: rowCount - 1, c: columnCount - 1 },
  })
}

const applyCurrencyFormat = (sheet: XLSX.WorkSheet, rowIndex: number, columnIndexes: number[]) => {
  columnIndexes.forEach((columnIndex) => {
    const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })
    const cell = sheet[address]
    if (cell && cell.t === 'n') {
      cell.z = '"¥"#,##0'
    }
  })
}

export const exportMonthlyReportExcel = (params: {
  title: string
  monthLabel: string
  monthKey: string
  rows: MonthlyReportExportRow[]
  totals: MonthlyReportExportTotals
}) => {
  const workbook = XLSX.utils.book_new()
  const worksheet: XLSX.WorkSheet = {}

  appendRow(worksheet, 0, [params.title])
  appendRow(worksheet, 1, [params.monthLabel])
  appendRow(worksheet, 2, ['DATE', 'L', 'LUNCH', 'D', 'DINNER', 'T', 'TOTAL', 'GRAND TOTAL', 'CREDIT', '10% TAX', '10% TAX AMOUNT', 'TOTAL SHOPPING'])
  appendRow(worksheet, 3, ['', 'P', 'SALE', 'P', 'SALE', 'P', 'SALE', 'SALE', 'SALE', 'SALE', 'AMOUNT', 'SHOPPING'])

  params.rows.forEach((row, index) => {
    const rowIndex = index + 4
    appendRow(worksheet, rowIndex, [
      row.dateLabel,
      row.lunchPersons,
      row.lunchSale,
      row.dinnerPersons,
      row.dinnerSale,
      row.totalPersons,
      row.totalSale,
      row.grandTotalSale,
      row.creditSale,
      row.tax10Sale,
      row.tax10Amount,
      row.totalShopping,
    ])
    applyCurrencyFormat(worksheet, rowIndex, [2, 4, 6, 7, 8, 9, 10, 11])
  })

  const totalsRowIndex = params.rows.length + 4
  appendRow(worksheet, totalsRowIndex, [
    'TOTAL',
    params.totals.lunchPersons,
    params.totals.lunchSale,
    params.totals.dinnerPersons,
    params.totals.dinnerSale,
    params.totals.totalPersons,
    params.totals.totalSale,
    params.totals.grandTotalSale,
    params.totals.creditSale,
    params.totals.tax10Sale,
    params.totals.tax10Amount,
    params.totals.totalShopping,
  ])
  applyCurrencyFormat(worksheet, totalsRowIndex, [2, 4, 6, 7, 8, 9, 10, 11])

  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 6 },
    { wch: 12 },
    { wch: 6 },
    { wch: 12 },
    { wch: 6 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 15 },
  ]
  worksheet['!merges'] = [
    XLSX.utils.decode_range('A1:L1'),
    XLSX.utils.decode_range('A2:L2'),
  ]
  setRange(worksheet, totalsRowIndex + 1, 12)

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Report')
  XLSX.writeFile(workbook, `${slugify(params.title)}-${params.monthKey}.xlsx`)
}

export const exportMonthlyReportPdf = (params: {
  title: string
  monthLabel: string
  rows: MonthlyReportExportRow[]
  totals: MonthlyReportExportTotals
}) => {
  pdfMake.createPdf(buildPdfDefinition(params)).open()
}

export const downloadMonthlyReportPdf = (params: {
  title: string
  monthLabel: string
  monthKey: string
  rows: MonthlyReportExportRow[]
  totals: MonthlyReportExportTotals
}) => {
  pdfMake.createPdf(buildPdfDefinition(params)).download(`${slugify(params.title)}-${params.monthKey}.pdf`)
}
