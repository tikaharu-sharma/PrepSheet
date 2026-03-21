import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
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
  CircularProgress,
  Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { useRestaurant } from '../context/useRestaurant'

export default function Restaurants() {
  const {
    restaurants,
    refreshRestaurants,
    addRestaurant,
    deleteRestaurant,
  } = useRestaurant()

  const [openDialog, setOpenDialog] = useState(false)
  const [newRestaurantName, setNewRestaurantName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [restaurantToDelete, setRestaurantToDelete] = useState<{ id: number; name: string } | null>(null)

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        setLoading(true)
        await refreshRestaurants()
      } catch {
        if (isMounted) {
          setError('Failed to load restaurants. Please refresh or re-login.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [refreshRestaurants])

  const handleAddRestaurant = async () => {
    if (!newRestaurantName.trim()) {
      alert('Please enter a restaurant name.')
      return
    }

    try {
      setLoading(true)
      await addRestaurant(newRestaurantName.trim())
      setNewRestaurantName('')
      setOpenDialog(false)
      setError(null)
    } catch {
      setError('Unable to add restaurant. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRestaurant = (id: number, name: string) => {
    setRestaurantToDelete({ id, name })
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!restaurantToDelete) return

    try {
      setLoading(true)
      await deleteRestaurant(restaurantToDelete.id)
      setError(null)
    } catch {
      setError('Unable to delete restaurant. Please try again.')
    } finally {
      setLoading(false)
      setDeleteConfirmOpen(false)
      setRestaurantToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false)
    setRestaurantToDelete(null)
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

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : restaurants.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No restaurants added yet. Click "Add Restaurant" to start.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ backgroundColor: 'grey.50', overflowX: 'auto' }}>
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
                          onClick={() => handleDeleteRestaurant(restaurant.id, restaurant.name)}
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
        <DialogContent sx={{ pt: 3, pb: 1 }}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the restaurant "{restaurantToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
