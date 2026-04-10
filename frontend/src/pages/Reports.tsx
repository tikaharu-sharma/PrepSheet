import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { fetchSales, type SaleRecord } from '../lib/api'
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
  if (!value) return ''
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value)
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
  lunchSale: number | null
  dinnerPersons: number | null
  totalSale: number | null
  totalCredit: number | null
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

    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(Date.UTC(year, monthValue - 1, index + 1))
      const isoDate = date.toISOString().slice(0, 10)
      const sale = salesByDate.get(isoDate)
      const totalSale = sale ? sale.lunch_sale + sale.dinner_sale : null

      return {
        date: isoDate,
        dateLabel: formatDayLabel(isoDate),
        sale: sale ?? null,
        lunchPersons: sale?.lunch_head_count ?? null,
        lunchSale: sale?.lunch_sale ?? null,
        dinnerPersons: sale?.dinner_head_count ?? null,
        totalSale,
        totalCredit: sale?.credit_sale ?? null,
      }
    })
  }, [filteredSales, month])

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" component="h1">
              Reports
            </Typography>
            <Typography color="text.secondary">
              Monthly restaurant report view.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Year"
              value={yearSelectValue}
              onChange={(e) => {
                const nextYear = e.target.value
                const nextMonthOptions = availablePeriods
                  .filter((period) => period.startsWith(`${nextYear}-`))
                  .map((period) => period.slice(5, 7))

                setSelectedYear(nextYear)
                setSelectedMonthNumber(nextMonthOptions[0] ?? '')
              }}
              sx={{ minWidth: 120 }}
              disabled={availableYears.length === 0}
            >
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Month"
              value={monthSelectValue}
              onChange={(e) => setSelectedMonthNumber(e.target.value)}
              sx={{ minWidth: 140 }}
              disabled={monthOptions.length === 0}
            >
              {monthOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Restaurant"
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value === '' ? '' : Number(e.target.value))}
              sx={{ minWidth: 260 }}
            >
              {restaurants.map((restaurant) => (
                <MenuItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !month ? (
          <Alert severity="info">No report data is available for the selected restaurant yet.</Alert>
        ) : (
          <Paper elevation={4} sx={{ p: 3, overflow: 'hidden' }}>
            <Stack spacing={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                  {selectedRestaurant?.name?.toUpperCase() ?? 'RESTAURANT REPORT'}
                </Typography>
              </Box>

              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table
                  size="small"
                  sx={{
                    tableLayout: 'fixed',
                    width: '100%',
                    '& .MuiTableCell-root': {
                      border: '1px solid #1f1f1f',
                      fontSize: '0.95rem',
                      py: 0.75,
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        rowSpan={2}
                        align="center"
                        sx={{ fontWeight: 700, width: '14%', backgroundColor: '#ffffff' }}
                      >
                        DATE
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        LUNCH
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        LUNCH
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        DINNER
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        DINNER
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        TOTAL
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        TOTAL
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
                        SALE
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        CREDIT
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}>
                        {formatMonthTitle(month)}
                      </TableCell>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <TableCell key={index} sx={{ backgroundColor: '#ffffff' }} />
                      ))}
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
                          {formatCurrency(row.lunchSale)}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {row.dinnerPersons ?? ''}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {formatCurrency(row.totalSale ? row.totalSale - (row.lunchSale ?? 0) : null)}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {formatCurrency(row.totalSale)}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#ffffff' }}>
                          {formatCurrency(row.totalCredit)}
                        </TableCell>
                      </TableRow>
                    ))}
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
