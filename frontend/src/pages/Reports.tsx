import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import { fetchSales, type SaleRecord } from '../lib/api'
import { downloadMonthlyReportPdf, exportMonthlyReportExcel, exportMonthlyReportPdf } from '../lib/monthlyReportExport'
import { useRestaurant } from '../context/useRestaurant'

const getCurrentMonth = () => new Date().toISOString().slice(0, 7)
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const getMonthDateRange = (month: string) => {
  const [year, monthValue] = month.split('-').map(Number)
  const lastDay = new Date(year, monthValue, 0).getDate()

  return {
    startDate: `${month}-01`,
    endDate: `${month}-${String(lastDay).padStart(2, '0')}`,
    daysInMonth: lastDay,
  }
}

const formatCurrency = (value: number | null | undefined) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

const formatMonthTitle = (month: string) => {
  const [year, monthValue] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthValue - 1, 1)))
}

const formatDayLabel = (dateString: string) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateString}T00:00:00Z`)).replace(' ', ', ')

interface ReportRow {
  date: string
  dateLabel: string
  sale: SaleRecord | null
  lunchPersons: number | null
  lunchSale: number
  dinnerPersons: number | null
  dinnerSale: number
  totalPersons: number
  totalSale: number | null
  grandTotalSale: number
  totalCredit: number
  tax10Sale: number
  tax10Amount: number
  totalShopping: number
}

const getAvailablePeriods = (sales: SaleRecord[]) =>
  Array.from(new Set(sales.map((sale) => sale.date.slice(0, 7)))).sort((left, right) => right.localeCompare(left))

const getDefaultPeriod = (periods: string[]) => {
  const currentMonth = getCurrentMonth()
  if (periods.includes(currentMonth)) {
    return currentMonth
  }

  return periods[0] ?? ''
}

export default function Reports() {
  const { restaurants } = useRestaurant()
  const [restaurantId, setRestaurantId] = useState<number | ''>('')
  const [allSales, setAllSales] = useState<SaleRecord[]>([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonthNumber, setSelectedMonthNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<ReportRow | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportAction, setExportAction] = useState('')

  useEffect(() => {
    if (restaurantId === '' && restaurants.length > 0) {
      setRestaurantId(restaurants[0].id)
    }
  }, [restaurants, restaurantId])

  useEffect(() => {
    let isMounted = true

    const loadReports = async () => {
      if (restaurantId === '') {
        setAllSales([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const salesData = await fetchSales({
          restaurantId,
        })

        if (!isMounted) return
        setAllSales(salesData)
      } catch (err) {
        if (!isMounted) return
        if (err instanceof Error && err.message) {
          setError(err.message)
        } else if (typeof err === 'object' && err !== null && 'message' in err) {
          setError((err as { message?: string }).message || 'Failed to load reports')
        } else {
          setError('Failed to load reports')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadReports()

    return () => {
      isMounted = false
    }
  }, [restaurantId])

  const selectedRestaurant = restaurants.find((restaurant) => restaurant.id === restaurantId) ?? null
  const availablePeriods = useMemo(() => getAvailablePeriods(allSales), [allSales])
  const availableYears = useMemo(
    () => Array.from(new Set(availablePeriods.map((period) => period.slice(0, 4)))).sort((left, right) => right.localeCompare(left)),
    [availablePeriods],
  )
  const monthOptions = useMemo(
    () =>
      availablePeriods
        .filter((period) => period.startsWith(`${selectedYear}-`))
        .map((period) => {
          const monthValue = period.slice(5, 7)
          return {
            value: monthValue,
            label: MONTH_LABELS[Number(monthValue) - 1] ?? monthValue,
          }
        }),
    [availablePeriods, selectedYear],
  )
  const yearSelectValue = availableYears.includes(selectedYear) ? selectedYear : ''
  const monthSelectValue = monthOptions.some((option) => option.value === selectedMonthNumber) ? selectedMonthNumber : ''
  const month = selectedYear && selectedMonthNumber ? `${selectedYear}-${selectedMonthNumber}` : ''

  useEffect(() => {
    const currentPeriod = selectedYear && selectedMonthNumber ? `${selectedYear}-${selectedMonthNumber}` : ''

    if (availablePeriods.length === 0) {
      if (selectedYear !== '') setSelectedYear('')
      if (selectedMonthNumber !== '') setSelectedMonthNumber('')
      return
    }

    const nextPeriod = availablePeriods.includes(currentPeriod) ? currentPeriod : getDefaultPeriod(availablePeriods)
    const [nextYear, nextMonthNumber] = nextPeriod.split('-')

    if (nextYear !== selectedYear) {
      setSelectedYear(nextYear)
    }

    if (nextMonthNumber !== selectedMonthNumber) {
      setSelectedMonthNumber(nextMonthNumber)
    }
  }, [availablePeriods, selectedMonthNumber, selectedYear])

  const filteredSales = useMemo(
    () => (month ? allSales.filter((sale) => sale.date.startsWith(`${month}-`)) : []),
    [allSales, month],
  )

  const rows = useMemo<ReportRow[]>(() => {
    if (!month) {
      return []
    }

    const { daysInMonth } = getMonthDateRange(month)
    const salesByDate = new Map(filteredSales.map((sale) => [sale.date, sale]))
    const [year, monthValue] = month.split('-').map(Number)
    let runningGrandTotal = 0

    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(Date.UTC(year, monthValue - 1, index + 1))
      const isoDate = date.toISOString().slice(0, 10)
      const sale = salesByDate.get(isoDate)
      const lunchSale = sale?.lunch_sale ?? 0
      const dinnerSale = sale?.dinner_sale ?? 0
      const totalSale = lunchSale + dinnerSale
      const totalPersons = (sale?.lunch_head_count ?? 0) + (sale?.dinner_head_count ?? 0)
      const totalCredit = sale?.credit_sale ?? 0
      const totalShopping = sale?.expenditures.reduce((sum, expense) => sum + expense.amount, 0) ?? 0
      const tax10Sale = totalSale
      const tax10Amount = Math.floor(totalSale / 11)

      runningGrandTotal += totalSale

      return {
        date: isoDate,
        dateLabel: formatDayLabel(isoDate),
        sale: sale ?? null,
        lunchPersons: sale?.lunch_head_count ?? null,
        lunchSale,
        dinnerPersons: sale?.dinner_head_count ?? null,
        dinnerSale,
        totalPersons,
        totalSale,
        grandTotalSale: runningGrandTotal,
        totalCredit,
        tax10Sale,
        tax10Amount,
        totalShopping,
      }
    })
  }, [filteredSales, month])

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          lunchPersons: acc.lunchPersons + (row.lunchPersons ?? 0),
          lunchSale: acc.lunchSale + row.lunchSale,
          dinnerPersons: acc.dinnerPersons + (row.dinnerPersons ?? 0),
          dinnerSale: acc.dinnerSale + row.dinnerSale,
          totalPersons: acc.totalPersons + row.totalPersons,
          totalSale: acc.totalSale + (row.totalSale ?? 0),
          grandTotalSale: row.grandTotalSale,
          totalCredit: acc.totalCredit + row.totalCredit,
          tax10Sale: acc.tax10Sale + row.tax10Sale,
          tax10Amount: acc.tax10Amount + row.tax10Amount,
          totalShopping: acc.totalShopping + row.totalShopping,
        }),
        {
          lunchPersons: 0,
          lunchSale: 0,
          dinnerPersons: 0,
          dinnerSale: 0,
          totalPersons: 0,
          totalSale: 0,
          grandTotalSale: 0,
          totalCredit: 0,
          tax10Sale: 0,
          tax10Amount: 0,
          totalShopping: 0,
        },
      ),
    [rows],
  )

  const reportTitle = useMemo(() => {
    if (!selectedRestaurant?.name) {
      return 'INDIAN RESTAURANT MINA'
    }

    const [baseName, branchName] = selectedRestaurant.name.split(' - ')
    if (!branchName) {
      return selectedRestaurant.name.toUpperCase()
    }

    return `${baseName.toUpperCase()} - ${branchName.toUpperCase()} BRANCH`
  }, [selectedRestaurant])

  const handleExportExcel = () => {
    if (!month || rows.length === 0) return
    setExportError(null)

    exportMonthlyReportExcel({
      title: reportTitle,
      monthLabel: formatMonthTitle(month),
      monthKey: month,
      rows: rows.map((row) => ({
        dateLabel: row.dateLabel,
        lunchPersons: row.lunchPersons,
        lunchSale: row.lunchSale,
        dinnerPersons: row.dinnerPersons,
        dinnerSale: row.dinnerSale,
        totalPersons: row.totalPersons,
        totalSale: row.totalSale ?? 0,
        grandTotalSale: row.grandTotalSale,
        creditSale: row.totalCredit,
        tax10Sale: row.tax10Sale,
        tax10Amount: row.tax10Amount,
        totalShopping: row.totalShopping,
      })),
      totals: {
        ...totals,
        creditSale: totals.totalCredit,
      },
    })
  }

  const handleExportPdf = () => {
    if (!month || rows.length === 0) return
    setExportError(null)

    try {
      exportMonthlyReportPdf({
        title: reportTitle,
        monthLabel: formatMonthTitle(month),
        rows: rows.map((row) => ({
          dateLabel: row.dateLabel,
          lunchPersons: row.lunchPersons,
          lunchSale: row.lunchSale,
          dinnerPersons: row.dinnerPersons,
          dinnerSale: row.dinnerSale,
          totalPersons: row.totalPersons,
          totalSale: row.totalSale ?? 0,
          grandTotalSale: row.grandTotalSale,
          creditSale: row.totalCredit,
          tax10Sale: row.tax10Sale,
          tax10Amount: row.tax10Amount,
          totalShopping: row.totalShopping,
        })),
        totals: {
          ...totals,
          creditSale: totals.totalCredit,
        },
      })
    } catch (err) {
      if (err instanceof Error) {
        setExportError(err.message)
        return
      }

      setExportError('Failed to export PDF')
    }
  }

  const handleDownloadPdf = () => {
    if (!month || rows.length === 0) return
    setExportError(null)

    try {
      downloadMonthlyReportPdf({
        title: reportTitle,
        monthLabel: formatMonthTitle(month),
        monthKey: month,
        rows: rows.map((row) => ({
          dateLabel: row.dateLabel,
          lunchPersons: row.lunchPersons,
          lunchSale: row.lunchSale,
          dinnerPersons: row.dinnerPersons,
          dinnerSale: row.dinnerSale,
          totalPersons: row.totalPersons,
          totalSale: row.totalSale ?? 0,
          grandTotalSale: row.grandTotalSale,
          creditSale: row.totalCredit,
          tax10Sale: row.tax10Sale,
          tax10Amount: row.tax10Amount,
          totalShopping: row.totalShopping,
        })),
        totals: {
          ...totals,
          creditSale: totals.totalCredit,
        },
      })
    } catch (err) {
      if (err instanceof Error) {
        setExportError(err.message)
        return
      }

      setExportError('Failed to download PDF')
    }
  }

  const handleExportActionChange = (event: SelectChangeEvent) => {
    const action = String(event.target.value)
    setExportAction(action)

    if (action === 'excel') {
      handleExportExcel()
    } else if (action === 'preview-pdf') {
      handleExportPdf()
    } else if (action === 'download-pdf') {
      handleDownloadPdf()
    }

    setExportAction('')
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontSize: { xs: '2.4rem', sm: '3rem' },
                lineHeight: 1.05,
                overflowWrap: 'anywhere',
              }}
            >
              Reports
            </Typography>
            <Typography color="text.secondary">
              Monthly restaurant report view.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            sx={{ width: { xs: '100%', lg: 'auto' } }}
          >
            <FormControl sx={{ minWidth: { xs: '100%', sm: 120 } }}>
              <InputLabel id="reports-year-select-label">Year</InputLabel>
              <Select
                labelId="reports-year-select-label"
                id="reports-year-select"
                value={yearSelectValue}
                label="Year"
                onChange={(event: SelectChangeEvent) => {
                  const nextYear = String(event.target.value)
                  const nextMonthOptions = availablePeriods
                    .filter((period) => period.startsWith(`${nextYear}-`))
                    .map((period) => period.slice(5, 7))

                  setSelectedYear(nextYear)
                  setSelectedMonthNumber(nextMonthOptions[0] ?? '')
                }}
                disabled={availableYears.length === 0}
              >
                {availableYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: { xs: '100%', sm: 160 } }}>
              <InputLabel id="reports-month-select-label">Month</InputLabel>
              <Select
                labelId="reports-month-select-label"
                id="reports-month-select"
                value={monthSelectValue}
                label="Month"
                onChange={(event: SelectChangeEvent) => setSelectedMonthNumber(String(event.target.value))}
                disabled={monthOptions.length === 0}
              >
                {monthOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: { xs: '100%', sm: 320 } }}>
              <InputLabel id="reports-restaurant-select-label">Restaurant</InputLabel>
              <Select
                labelId="reports-restaurant-select-label"
                id="reports-restaurant-select"
                value={restaurantId === '' ? '' : String(restaurantId)}
                label="Restaurant"
                onChange={(event: SelectChangeEvent) => setRestaurantId(event.target.value === '' ? '' : Number(event.target.value))}
              >
                {restaurants.map((restaurant) => (
                  <MenuItem key={restaurant.id} value={String(restaurant.id)}>
                    {restaurant.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
              <InputLabel id="reports-export-options-label">Export Options</InputLabel>
              <Select
                labelId="reports-export-options-label"
                id="reports-export-options"
                value={exportAction}
                label="Export Options"
                onChange={handleExportActionChange}
                displayEmpty={false}
                disabled={!month || rows.length === 0}
              >
                <MenuItem value="excel">Export Excel</MenuItem>
                <MenuItem value="preview-pdf">Preview PDF</MenuItem>
                <MenuItem value="download-pdf">Download PDF</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
        {exportError ? <Alert severity="error">{exportError}</Alert> : null}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !month ? (
          <Alert severity="info">No report data is available for the selected restaurant yet.</Alert>
        ) : (
          <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, overflow: 'hidden' }}>
            <Stack spacing={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    lineHeight: 1.1,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {reportTitle}
                </Typography>
                <Typography color="text.secondary">{formatMonthTitle(month)}</Typography>
              </Box>

              <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table
                  size="small"
                  sx={{
                    minWidth: 1280,
                    '& .MuiTableCell-root': {
                      border: '1px solid #1f1f1f',
                      fontSize: '0.95rem',
                      py: 0.75,
                      whiteSpace: 'nowrap',
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        rowSpan={2}
                        align="center"
                        sx={{ fontWeight: 700, minWidth: 120, backgroundColor: '#ffffff' }}
                      >
                        DATE
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        L
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        LUNCH
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        D
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        DINNER
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        T
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        TOTAL
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        GRAND TOTAL
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        CREDIT
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        10% TAX
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        10% TAX AMOUNT
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        TOTAL SHOPPING
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        PERSONS
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        SALE
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        PERSON
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        SALE
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        PERSONS
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        SALE
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        SALE
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        SALE
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        SALE
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        AMOUNT
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        SHOPPING
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                          <Typography
                            component="button"
                            type="button"
                            onClick={() => setSelectedRow(row)}
                            sx={{
                              border: 0,
                              background: 'transparent',
                              p: 0,
                              font: 'inherit',
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: '#1f1f1f',
                              textAlign: 'left',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {row.dateLabel}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {row.lunchPersons ?? ''}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {row.lunchSale > 0 ? formatCurrency(row.lunchSale) : ''}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {row.dinnerPersons ?? ''}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {row.dinnerSale > 0 ? formatCurrency(row.dinnerSale) : ''}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {row.totalPersons}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {formatCurrency(row.totalSale)}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {formatCurrency(row.grandTotalSale)}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {formatCurrency(row.totalCredit)}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {formatCurrency(row.tax10Sale)}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {formatCurrency(row.tax10Amount)}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {formatCurrency(row.totalShopping)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>TOTAL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        {totals.lunchPersons}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        {formatCurrency(totals.lunchSale)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        {totals.dinnerPersons}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        {formatCurrency(totals.dinnerSale)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        {totals.totalPersons}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        {formatCurrency(totals.totalSale)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        {formatCurrency(totals.grandTotalSale)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        {formatCurrency(totals.totalCredit)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        {formatCurrency(totals.tax10Sale)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        {formatCurrency(totals.tax10Amount)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        {formatCurrency(totals.totalShopping)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </Paper>
        )}
      </Stack>

      <Dialog open={Boolean(selectedRow)} onClose={() => setSelectedRow(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedRestaurant?.name ?? 'Restaurant'} | {selectedRow?.date ? formatDayLabel(selectedRow.date) : ''}
        </DialogTitle>
        <DialogContent dividers>
          {selectedRow?.sale ? (
            <Stack spacing={2}>
              <Stack spacing={1}>
                <Typography><strong>Lunch Sale:</strong> {formatCurrency(selectedRow.sale.lunch_sale) || '¥0'}</Typography>
                <Typography><strong>Dinner Sale:</strong> {formatCurrency(selectedRow.sale.dinner_sale) || '¥0'}</Typography>
                <Typography><strong>Total Sale:</strong> {formatCurrency(selectedRow.sale.lunch_sale + selectedRow.sale.dinner_sale) || '¥0'}</Typography>
                <Typography><strong>Credit Sale:</strong> {formatCurrency(selectedRow.sale.credit_sale) || '¥0'}</Typography>
                <Typography><strong>Reji Money:</strong> {formatCurrency(selectedRow.sale.reji_money) || '¥0'}</Typography>
                <Typography><strong>Bank Deposit:</strong> Not available yet</Typography>
              </Stack>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Expenditures
                </Typography>
                {selectedRow.sale.expenditures.length > 0 ? (
                  <Stack spacing={0.75}>
                    {selectedRow.sale.expenditures.map((expense, index) => (
                      <Typography key={`${expense.title}-${index}`}>
                        {expense.title}: {formatCurrency(expense.amount) || '¥0'}
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">No expenditures recorded.</Typography>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Notes
                </Typography>
                <Typography color={selectedRow.sale.note ? 'text.primary' : 'text.secondary'}>
                  {selectedRow.sale.note || 'No notes recorded.'}
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Typography color="text.secondary">
              No sales entry was recorded for this date. The restaurant may have been closed.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  )
}
