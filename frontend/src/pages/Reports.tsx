import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Container,
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
  MenuItem,
} from '@mui/material'
import { fetchMonthlyReport, fetchSales, type MonthlyReport, type SaleRecord } from '../lib/api'
import { useRestaurant } from '../context/useRestaurant'

const getCurrentMonth = () => new Date().toISOString().slice(0, 7)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

export default function Reports() {
  const { restaurants } = useRestaurant()
  const [month, setMonth] = useState(getCurrentMonth())
  const [restaurantId, setRestaurantId] = useState<number | ''>('')
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [summary, setSummary] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadReports = async () => {
      try {
        setLoading(true)
        setError(null)

        const [salesData, monthlyData] = await Promise.all([
          fetchSales({
            startDate: `${month}-01`,
            endDate: `${month}-31`,
            restaurantId: restaurantId || undefined,
          }),
          fetchMonthlyReport(month, restaurantId || undefined),
        ])

        if (!isMounted) return
        setSales(salesData)
        setSummary(monthlyData)
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
  }, [month, restaurantId])

  const totalExpenditures = useMemo(
    () =>
      sales.reduce(
        (sum, sale) => sum + sale.expenditures.reduce((expenseSum, exp) => expenseSum + exp.amount, 0),
        0
      ),
    [sales]
  )

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" component="h1">
              Reports
            </Typography>
            <Typography color="text.secondary">
              View monthly sales totals and submitted daily entries.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Restaurant"
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value === '' ? '' : Number(e.target.value))}
              sx={{ minWidth: 240 }}
            >
              <MenuItem value="">All Restaurants</MenuItem>
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
        ) : (
          <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Card sx={{ p: 3, flex: 1 }}>
                <Typography variant="overline" color="text.secondary">
                  Total Sales
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(summary?.total_sales ?? 0)}
                </Typography>
              </Card>
              <Card sx={{ p: 3, flex: 1 }}>
                <Typography variant="overline" color="text.secondary">
                  Lunch Sales
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(summary?.total_lunch ?? 0)}
                </Typography>
              </Card>
              <Card sx={{ p: 3, flex: 1 }}>
                <Typography variant="overline" color="text.secondary">
                  Dinner Sales
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(summary?.total_dinner ?? 0)}
                </Typography>
              </Card>
              <Card sx={{ p: 3, flex: 1 }}>
                <Typography variant="overline" color="text.secondary">
                  Expenditures
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(totalExpenditures)}
                </Typography>
              </Card>
            </Stack>

            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Monthly Summary
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                <Typography>Month: {summary?.month ?? month}</Typography>
                <Typography>Entries: {summary?.entry_count ?? 0}</Typography>
              </Stack>
            </Card>

            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Daily Sales Entries
              </Typography>

              {sales.length === 0 ? (
                <Typography color="text.secondary">
                  No sales entries found for the selected month.
                </Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Restaurant</TableCell>
                        <TableCell align="right">Lunch Persons</TableCell>
                        <TableCell align="right">Lunch Sale</TableCell>
                        <TableCell align="right">Dinner Persons</TableCell>
                        <TableCell align="right">Dinner Sale</TableCell>
                        <TableCell align="right">Total Sale</TableCell>
                        <TableCell align="right">Credit Sale</TableCell>
                        <TableCell align="right">Reji Money</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{sale.date}</TableCell>
                          <TableCell>{sale.restaurant_name}</TableCell>
                          <TableCell align="right">{sale.lunch_head_count}</TableCell>
                          <TableCell align="right">{formatCurrency(sale.lunch_sale)}</TableCell>
                          <TableCell align="right">{sale.dinner_head_count}</TableCell>
                          <TableCell align="right">{formatCurrency(sale.dinner_sale)}</TableCell>
                          <TableCell align="right">{formatCurrency(sale.lunch_sale + sale.dinner_sale)}</TableCell>
                          <TableCell align="right">{formatCurrency(sale.credit_sale)}</TableCell>
                          <TableCell align="right">{formatCurrency(sale.reji_money)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </>
        )}
      </Stack>
    </Container>
  )
}
