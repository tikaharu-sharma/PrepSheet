import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import AddIcon from '@mui/icons-material/Add'
import { getEmployees, type Employee } from '../lib/api'
import { useRestaurant } from '../context/useRestaurant'
import type { Restaurant } from '../lib/types'

const formatAddedDate = (value?: string) => {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Unknown'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

const getEmployeeInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export default function Restaurants() {
  const {
    restaurants,
    refreshRestaurants,
    addRestaurant,
    updateRestaurant,
    deleteRestaurant,
  } = useRestaurant()

  const [openDialog, setOpenDialog] = useState(false)
  const [newRestaurantName, setNewRestaurantName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [restaurantToDelete, setRestaurantToDelete] = useState<{ id: number; name: string } | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [restaurantToEdit, setRestaurantToEdit] = useState<Restaurant | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        setLoading(true)
        const [_, employeeData] = await Promise.all([refreshRestaurants(), getEmployees()])
        if (!isMounted) return
        setEmployees(employeeData)
        setError(null)
      } catch (err: unknown) {
        if (!isMounted) return

        let message = 'Failed to load restaurants. Please refresh or re-login.'
        if (err instanceof Error && err.message.trim() !== '') {
          message = `Failed to load restaurants: ${err.message}`
        }
        setError(message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [refreshRestaurants])

  const employeeMapByRestaurant = useMemo(() => {
    const nextMap = new Map<number, Employee[]>()

    employees.forEach((employee) => {
      employee.restaurants.forEach((restaurant) => {
        const current = nextMap.get(restaurant.id) ?? []
        current.push(employee)
        nextMap.set(restaurant.id, current)
      })
    })

    return nextMap
  }, [employees])

  const sortedRestaurants = useMemo(() => {
    return [...restaurants].sort((left, right) => {
      const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0
      const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0
      if (leftTime !== rightTime) {
        return rightTime - leftTime
      }
      return left.name.localeCompare(right.name)
    })
  }, [restaurants])

  const handleAddRestaurant = async () => {
    if (!newRestaurantName.trim()) {
      alert('Please enter a restaurant name.')
      return
    }

    try {
      setLoading(true)
      if (isEditMode && restaurantToEdit) {
        await updateRestaurant(restaurantToEdit.id, newRestaurantName.trim())
      } else {
        await addRestaurant(newRestaurantName.trim())
      }

      setNewRestaurantName('')
      setOpenDialog(false)
      setIsEditMode(false)
      setRestaurantToEdit(null)
      setError(null)
      await refreshRestaurants()
    } catch (err: unknown) {
      let message = `Unable to ${isEditMode ? 'update' : 'add'} restaurant. Please try again.`
      if (err instanceof Error) {
        message = err.message
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        const maybeMessage = (err as { message?: string }).message
        if (typeof maybeMessage === 'string') {
          message = maybeMessage
        }
      }
      setError(`Unable to ${isEditMode ? 'update' : 'add'} restaurant. ${message}`)
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
      await refreshRestaurants()
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

  const handleEditRestaurant = (restaurant: Restaurant) => {
    setRestaurantToEdit(restaurant)
    setNewRestaurantName(restaurant.name)
    setIsEditMode(true)
    setOpenDialog(true)
  }

  const handleAddClick = () => {
    setIsEditMode(false)
    setRestaurantToEdit(null)
    setNewRestaurantName('')
    setOpenDialog(true)
  }

  const handleDialogClose = () => {
    setNewRestaurantName('')
    setOpenDialog(false)
    setIsEditMode(false)
    setRestaurantToEdit(null)
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography
              variant="h3"
              component="h1"
              sx={{ fontSize: { xs: '2.2rem', md: '2.8rem' }, lineHeight: 1.02, fontWeight: 700 }}
            >
              Restaurants
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
              Track your branch network, see who is assigned to each location, and review how recently each restaurant was added.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            sx={{
              px: 2.5,
              py: 1.2,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #2a6d57 0%, #4ea674 100%)',
              boxShadow: '0 14px 26px rgba(78, 166, 116, 0.22)',
            }}
          >
            Add Restaurant
          </Button>
        </Box>

        <Paper elevation={6} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Box
            sx={{
              px: { xs: 2, md: 3 },
              py: 2.5,
              background: 'linear-gradient(135deg, #17362d 0%, #2f745e 100%)',
              color: '#ffffff',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Restaurant Directory</Typography>
            <Typography sx={{ opacity: 0.82, mt: 0.5 }}>
              Sorted by date added, newest first.
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : sortedRestaurants.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
              No restaurants added yet. Click "Add Restaurant" to start.
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f7faf7' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Restaurant</TableCell>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Date Added</TableCell>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', lg: 'table-cell' } }}>Assigned Employees</TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, minWidth: { xs: 160, sm: 190 } }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedRestaurants.map((restaurant) => {
                    const assignedEmployees = employeeMapByRestaurant.get(restaurant.id) ?? []

                    return (
                      <TableRow
                        key={restaurant.id}
                        hover
                        sx={{
                          '&:last-child td': { borderBottom: 0 },
                        }}
                      >
                        <TableCell sx={{ minWidth: 300 }}>
                          <Stack spacing={0.75}>
                            <Typography sx={{ fontWeight: 600 }}>{restaurant.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Branch ID #{restaurant.id}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ minWidth: 140, display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography sx={{ fontWeight: 500 }}>
                            {formatAddedDate(restaurant.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 280, display: { xs: 'none', lg: 'table-cell' } }}>
                          {assignedEmployees.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No employees assigned
                            </Typography>
                          ) : (
                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                              {assignedEmployees.map((employee) => (
                                <Chip
                                  key={employee.id}
                                  avatar={<Avatar>{getEmployeeInitials(employee.name)}</Avatar>}
                                  label={employee.name}
                                  variant="outlined"
                                  sx={{ borderRadius: 2, backgroundColor: '#ffffff' }}
                                />
                              ))}
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ minWidth: { xs: 160, sm: 190 } }}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                            sx={{ justifyContent: 'center', alignItems: 'center' }}
                          >
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleEditRestaurant(restaurant)}
                              aria-label={`Edit ${restaurant.name}`}
                              sx={{ minWidth: { xs: 96, sm: 84 } }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleDeleteRestaurant(restaurant.id, restaurant.name)}
                              aria-label={`Delete ${restaurant.name}`}
                              sx={{ minWidth: { xs: 96, sm: 84 } }}
                            >
                              Delete
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Divider />
          <Box sx={{ px: 3, py: 2.25, backgroundColor: '#fcfdfb' }}>
            <Typography variant="body2" color="text.secondary">
              Total Restaurants: {restaurants.length}
            </Typography>
          </Box>
        </Paper>
      </Stack>

      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? 'Edit Restaurant' : 'Add New Restaurant'}</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Stack spacing={2}>
            <TextField
              autoFocus
              label="Restaurant Name/Location"
              fullWidth
              value={newRestaurantName}
              onChange={(e) => setNewRestaurantName(e.target.value)}
              placeholder="e.g., Indian Restaurant Mina - Branch Name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddRestaurant()
                }
              }}
            />
            <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
              <Button
                onClick={handleDialogClose}
                variant="outlined"
                sx={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddRestaurant}
                variant="contained"
                sx={{ flex: 1 }}
              >
                {isEditMode ? 'Update' : 'Add'}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Restaurant</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{restaurantToDelete?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
