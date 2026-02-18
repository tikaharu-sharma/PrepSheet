import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Container,
  Paper,
  IconButton,
  MenuItem,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

interface Expenditure {
  id: string
  title: string
  amount: string
}

interface SalesData {
  date: string
  restaurant: string
  lunchHeadCount: string
  lunchSale: string
  dinnerHeadCount: string
  dinnerSale: string
  creditSale: string
  rejiMoney: string
  expenditures: Expenditure[]
  note: string
}

const RESTAURANTS = [
  'Restaurant 1',
  'Restaurant 2',
  'Restaurant 3',
  'Restaurant 4',
  'Restaurant 5',
  'Restaurant 6',
]

const getTodayDate = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

export default function SalesEntry() {
  const [step, setStep] = useState<1 | 2>(1)
  const [dateValue, setDateValue] = useState(getTodayDate())
  const [restaurant, setRestaurant] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)

  const [sales, setSales] = useState<SalesData>({
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

  const handleDateRestaurantSubmit = () => {
    if (!restaurant) {
      alert('Please select a restaurant.')
      return
    }
    setSales((prev) => ({ ...prev, date: dateValue, restaurant }))
    setStep(2)
  }

  const handleSalesChange = (
    field: keyof Omit<SalesData, 'expenditures'>,
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

  const handleSubmit = () => {
    // Mock submit - later will call API
    console.log('Sales data submitted:', sales)
    setSuccessOpen(true)

    // Reset form after success
    setTimeout(() => {
      setSuccessOpen(false)
      setSales({
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
      setStep(1)
      setDateValue('')
      setRestaurant('')
    }, 2000)
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
              value={restaurant}
              onChange={(e) => setRestaurant(e.target.value)}
              fullWidth
            >
              <MenuItem value="">-- Choose Restaurant --</MenuItem>
              {RESTAURANTS.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
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

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Lunch Sales
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              label="No. of Persons (Lunch)"
              type="number"
              value={sales.lunchHeadCount}
              onChange={(e) => handleSalesChange('lunchHeadCount', e.target.value)}
              fullWidth
            />
            <TextField
              label="Lunch Sale"
              type="number"
              inputProps={{ step: '0.01' }}
              value={sales.lunchSale}
              onChange={(e) => handleSalesChange('lunchSale', e.target.value)}
              fullWidth
            />
          </Stack>

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Dinner Sales
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              label="No. of Persons (Dinner)"
              type="number"
              value={sales.dinnerHeadCount}
              onChange={(e) => handleSalesChange('dinnerHeadCount', e.target.value)}
              fullWidth
            />
            <TextField
              label="Dinner Sale"
              type="number"
              inputProps={{ step: '0.01' }}
              value={sales.dinnerSale}
              onChange={(e) => handleSalesChange('dinnerSale', e.target.value)}
              fullWidth
            />
          </Stack>

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Additional Sales & Cash
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Credit Sale (Cards)"
              type="number"
              inputProps={{ step: '0.01' }}
              value={sales.creditSale}
              onChange={(e) => handleSalesChange('creditSale', e.target.value)}
              fullWidth
            />
            <TextField
              label="Reji Money (Opening Balance)"
              type="number"
              inputProps={{ step: '0.01' }}
              value={sales.rejiMoney}
              onChange={(e) => handleSalesChange('rejiMoney', e.target.value)}
              fullWidth
            />
          </Stack>

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 3 }}>
            Expenditures
          </Typography>
          <Stack spacing={2}>
            {sales.expenditures.map((exp) => (
              <Paper key={exp.id} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
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
                    sx={{ minWidth: 120 }}
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
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ py: 1.2 }}
              onClick={handleSubmit}
            >
              Submit
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
