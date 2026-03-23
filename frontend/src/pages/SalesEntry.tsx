import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Container,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { useRestaurant } from '../context/useRestaurant'
import { submitSale } from '../lib/api'

interface ExpenditureDraft {
  id: string
  title: string
  amount: string
}

interface SalesDraft {
  date: string
  restaurant: string
  lunchHeadCount: string
  lunchSale: string
  dinnerHeadCount: string
  dinnerSale: string
  creditSale: string
  rejiMoney: string
  expenditures: ExpenditureDraft[]
  note: string
}

const getTodayDate = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

const createInitialSalesDraft = (): SalesDraft => ({
  date: '',
  restaurant: '',
  lunchHeadCount: '',
  lunchSale: '',
  dinnerHeadCount: '',
  dinnerSale: '',
  creditSale: '',
  rejiMoney: '',
  expenditures: [],
  note: '',
})

export default function SalesEntry() {
  const { restaurants } = useRestaurant()
  const [step, setStep] = useState<1 | 2>(1)
  const [dateValue, setDateValue] = useState(getTodayDate())
  const [restaurantId, setRestaurantId] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [sales, setSales] = useState<SalesDraft>(createInitialSalesDraft())

  const handleDateRestaurantSubmit = () => {
    if (!dateValue) {
      setError('Date is required.')
      return
    }
    if (!restaurantId) {
      setError('Please select a restaurant.')
      return
    }

    const selectedRestaurant = restaurants.find((item) => String(item.id) === restaurantId)
    if (!selectedRestaurant) {
      setError('Selected restaurant could not be found.')
      return
    }

    setError(null)
    setSales((prev) => ({ ...prev, date: dateValue, restaurant: selectedRestaurant.name }))
    setStep(2)
  }

  const handleSalesChange = (
    field: keyof Omit<SalesDraft, 'expenditures'>,
    value: string
  ) => {
    setSales((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddExpenditure = () => {
    setSales((prev) => ({
      ...prev,
      expenditures: [
        ...prev.expenditures,
        { id: Date.now().toString(), title: '', amount: '' },
      ],
    }))
  }

  const handleExpenditureChange = (
    id: string,
    field: 'title' | 'amount',
    value: string
  ) => {
    setSales((prev) => ({
      ...prev,
      expenditures: prev.expenditures.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }))
  }

  const handleDeleteExpenditure = (id: string) => {
    setSales((prev) => ({
      ...prev,
      expenditures: prev.expenditures.filter((exp) => exp.id !== id),
    }))
  }

  const validateSalesEntry = (): string | null => {
    const requiredFields: Array<[string, string]> = [
      ['Lunch persons', sales.lunchHeadCount],
      ['Lunch sale', sales.lunchSale],
      ['Dinner persons', sales.dinnerHeadCount],
      ['Dinner sale', sales.dinnerSale],
      ['Credit sale', sales.creditSale],
      ['Reji money', sales.rejiMoney],
    ]

    for (const [label, value] of requiredFields) {
      if (value.trim() === '') {
        return `${label} is required.`
      }
    }

    for (const exp of sales.expenditures) {
      const hasTitle = exp.title.trim() !== ''
      const hasAmount = exp.amount.trim() !== ''
      if (hasTitle !== hasAmount) {
        return 'Each expenditure must include both title and amount.'
      }
      if (hasAmount && Number(exp.amount) < 0) {
        return 'Expenditure amounts cannot be negative.'
      }
    }

    return null
  }

  const resetForm = () => {
    setSales(createInitialSalesDraft())
    setStep(1)
    setDateValue(getTodayDate())
    setRestaurantId('')
  }

  const handleSubmit = async () => {
    const validationError = validateSalesEntry()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      await submitSale({
        date: sales.date,
        restaurant_id: Number(restaurantId),
        restaurant: sales.restaurant,
        lunch_head_count: Number(sales.lunchHeadCount),
        lunch_sale: Number(sales.lunchSale),
        dinner_head_count: Number(sales.dinnerHeadCount),
        dinner_sale: Number(sales.dinnerSale),
        credit_sale: Number(sales.creditSale),
        reji_money: Number(sales.rejiMoney),
        expenditures: sales.expenditures
          .filter((exp) => exp.title.trim() !== '' && exp.amount.trim() !== '')
          .map((exp) => ({
            title: exp.title.trim(),
            amount: Number(exp.amount),
          })),
        note: sales.note.trim(),
      })

      setSuccessOpen(true)
      resetForm()
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message)
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        const message = (err as { message?: string }).message
        setError(message || 'Failed to submit sales entry.')
      } else {
        setError('Failed to submit sales entry.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 1) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card elevation={6} sx={{ p: 4, borderRadius: 3 }}>
          <Stack spacing={3}>
            <Typography variant="h5" component="h1" align="center">
              Daily Sales Entry
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Step 1: Select Date & Restaurant
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Date"
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              fullWidth
              slotProps={{ input: { placeholder: 'Select a date' } }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              label="Select Restaurant"
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              fullWidth
            >
              <MenuItem value="">-- Choose Restaurant --</MenuItem>
              {restaurants.map((r) => (
                <MenuItem key={r.id} value={String(r.id)}>
                  {r.name}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ py: 1.2, mt: 2 }}
              onClick={handleDateRestaurantSubmit}
            >
              Next
            </Button>
          </Stack>
        </Card>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={6} sx={{ p: 4, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" component="h1" align="center">
              Sales Entry for {sales.restaurant}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {sales.date}
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Lunch Sales
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="No. of Persons (Lunch)"
              type="number"
              value={sales.lunchHeadCount}
              onChange={(e) => handleSalesChange('lunchHeadCount', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Lunch Sale"
              type="number"
              inputProps={{ step: '0.01' }}
              value={sales.lunchSale}
              onChange={(e) => handleSalesChange('lunchSale', e.target.value)}
              fullWidth
              required
            />
          </Stack>

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Dinner Sales
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="No. of Persons (Dinner)"
              type="number"
              value={sales.dinnerHeadCount}
              onChange={(e) => handleSalesChange('dinnerHeadCount', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Dinner Sale"
              type="number"
              inputProps={{ step: '0.01' }}
              value={sales.dinnerSale}
              onChange={(e) => handleSalesChange('dinnerSale', e.target.value)}
              fullWidth
              required
            />
          </Stack>

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Additional Sales & Cash
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Credit Sale (Cards)"
              type="number"
              inputProps={{ step: '0.01' }}
              value={sales.creditSale}
              onChange={(e) => handleSalesChange('creditSale', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Reji Money"
              type="number"
              inputProps={{ step: '0.01' }}
              value={sales.rejiMoney}
              onChange={(e) => handleSalesChange('rejiMoney', e.target.value)}
              fullWidth
              required
            />
          </Stack>

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 3 }}>
            Expenditures
          </Typography>
          <Stack spacing={2}>
            {sales.expenditures.map((exp) => (
              <Paper key={exp.id} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                  <TextField
                    label="Title"
                    value={exp.title}
                    onChange={(e) =>
                      handleExpenditureChange(exp.id, 'title', e.target.value)
                    }
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Amount"
                    type="number"
                    inputProps={{ step: '0.01' }}
                    value={exp.amount}
                    onChange={(e) =>
                      handleExpenditureChange(exp.id, 'amount', e.target.value)
                    }
                    size="small"
                    sx={{ minWidth: 140 }}
                  />
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteExpenditure(exp.id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Paper>
            ))}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddExpenditure}
              fullWidth
            >
              Add Expenditure
            </Button>
          </Stack>

          <TextField
            label="Notes (optional)"
            multiline
            rows={3}
            value={sales.note}
            onChange={(e) => handleSalesChange('note', e.target.value)}
            fullWidth
            placeholder="Add any notes or observations..."
          />

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              sx={{ py: 1.2 }}
              onClick={() => setStep(1)}
              disabled={submitting}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ py: 1.2 }}
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </Stack>
        </Stack>
      </Card>

      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle>Success!</DialogTitle>
        <DialogContent>
          <Typography>Daily sales data has been successfully logged.</Typography>
        </DialogContent>
      </Dialog>
    </Container>
  )
}
