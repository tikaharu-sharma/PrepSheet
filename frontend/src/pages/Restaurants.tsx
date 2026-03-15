import { useState, useEffect } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

export interface Restaurant {
  id: string
  name: string
}

const DEFAULT_RESTAURANTS: Restaurant[] = [
  { id: '1', name: 'Indian Restaurant Mina - Munakata' },
  { id: '2', name: 'Indian Restaurant Mina - Norimatsu' },
  { id: '3', name: 'Indian Restaurant Mina - Tobata' },
  { id: '4', name: 'Indian Restaurant Mina - Asakawa' },
  { id: '5', name: 'Indian Restaurant Mina - Kurosaki' },
  { id: '6', name: 'Indian Restaurant Mina - Shingu' },
]

const STORAGE_KEY = 'prepsheet_restaurants'

export function getRestaurants(): Restaurant[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return DEFAULT_RESTAURANTS
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RESTAURANTS))
  return DEFAULT_RESTAURANTS
}

export function saveRestaurants(restaurants: Restaurant[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants))
}

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [newRestaurantName, setNewRestaurantName] = useState('')

  useEffect(() => {
    setRestaurants(getRestaurants())
  }, [])

  const handleAddRestaurant = () => {
    if (!newRestaurantName.trim()) {
      alert('Please enter a restaurant name.')
      return
    }

    const newRestaurant: Restaurant = {
      id: Date.now().toString(),
      name: newRestaurantName.trim(),
    }

    const updated = [...restaurants, newRestaurant]
    setRestaurants(updated)
    saveRestaurants(updated)
    setNewRestaurantName('')
    setOpenDialog(false)
  }

  const handleDeleteRestaurant = (id: string) => {
    const updated = restaurants.filter((r) => r.id !== id)
    setRestaurants(updated)
    saveRestaurants(updated)
  }

  const handleDialogClose = () => {
    setNewRestaurantName('')
    setOpenDialog(false)
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={6} sx={{ p: 4, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="h1">
              Restaurant Management
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Add Restaurant
            </Button>
          </Box>

          {restaurants.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No restaurants added yet. Click "Add Restaurant" to start.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ backgroundColor: 'grey.50' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Restaurant Name
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {restaurants.map((restaurant, index) => (
                    <TableRow
                      key={restaurant.id}
                      sx={{
                        backgroundColor: index % 2 === 0 ? 'grey.50' : 'white',
                        '&:hover': { backgroundColor: 'grey.100' },
                      }}
                    >
                      <TableCell>{restaurant.name}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteRestaurant(restaurant.id)}
                          title="Delete restaurant"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Typography variant="body2" color="text.secondary">
            Total Restaurants: {restaurants.length}
          </Typography>
        </Stack>
      </Card>

      {/* Add Restaurant Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Restaurant</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            <TextField
              autoFocus
              label="Restaurant Name/Location"
              fullWidth
              value={newRestaurantName}
              onChange={(e) => setNewRestaurantName(e.target.value)}
              placeholder="e.g., Indian Restaurant Mina - Branch Name"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddRestaurant()
                }
              }}
            />
            <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleDialogClose}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleAddRestaurant}
              >
                Add
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Container>
  )
}
