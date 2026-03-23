import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Container,
  Checkbox,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { getEmployees, createEmployee, updateEmployeeStatus, getAssignments, addAssignment, deleteAssignment, fetchRestaurants } from '../lib/api'
import type { Employee, Assignment, Restaurant, CreateEmployeeRequest } from '../lib/api'


type SnackbarState = {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'info' | 'warning'
}

export const Users: React.FC = () => {
  // =========================================================================
  // STATE
  // =========================================================================

  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' })
  const [searchTerm, setSearchTerm] = useState('')

  // Create employee dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('')
  const [newEmployeePassword, setNewEmployeePassword] = useState('')
  const [newEmployeeRestaurants, setNewEmployeeRestaurants] = useState<number[]>([])
  const [newEmployeeStatus, setNewEmployeeStatus] = useState<'active' | 'inactive'>('active')

  // Assign restaurants dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedRestaurantForAssign, setSelectedRestaurantForAssign] = useState<number | null>(null)

  // =========================================================================
  // HELPERS - MUST BE DEFINED BEFORE THEY'RE USED
  // =========================================================================

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // =========================================================================
  // INITIALIZATION & DATA LOADING
  // =========================================================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [empsData, assignData, restData] = await Promise.all([
        getEmployees(),
        getAssignments(),
        fetchRestaurants(),
      ])
      setEmployees(empsData)
      setAssignments(assignData)
      setRestaurants(restData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setSnackbar({ open: true, message, severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // =========================================================================
  // MORE HELPERS
  // =========================================================================

  const getEmployeeRestaurants = (employeeId: number): Restaurant[] => {
    const assignedIds = assignments
      .filter((a) => a.employee_id === employeeId)
      .map((a) => a.restaurant_id)
    return restaurants.filter((r) => assignedIds.includes(r.id))
  }

  const getUnassignedRestaurants = (employeeId: number): Restaurant[] => {
    const assignedIds = assignments
      .filter((a) => a.employee_id === employeeId)
      .map((a) => a.restaurant_id)
    return restaurants.filter((r) => !assignedIds.includes(r.id))
  }

  const filteredEmployees = searchTerm
    ? employees.filter((emp) =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : employees

  // =========================================================================
  // HANDLERS: CREATE EMPLOYEE
  // =========================================================================

  const handleCreateDialogOpen = () => {
    setNewEmployeeName('')
    setNewEmployeeEmail('')
    setNewEmployeePassword('')
    setNewEmployeeRestaurants([])
    setNewEmployeeStatus('active')
    setCreateDialogOpen(true)
  }

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false)
  }

  const handleCreateEmployee = async () => {
    if (!newEmployeeName.trim() || !newEmployeeEmail.trim() || !newEmployeePassword.trim()) {
      showSnackbar('Name, email, and password are required', 'error')
      return
    }

    try {
      setLoading(true)
      const req: CreateEmployeeRequest = {
        name: newEmployeeName.trim(),
        email: newEmployeeEmail.trim(),
        password: newEmployeePassword,
        status: newEmployeeStatus,
        restaurants: newEmployeeRestaurants,
      }
      await createEmployee(req)
      showSnackbar('Employee created successfully', 'success')
      handleCreateDialogClose()
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create employee'
      showSnackbar(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleRestaurantSelection = (restaurantId: number) => {
    if (newEmployeeRestaurants.includes(restaurantId)) {
      setNewEmployeeRestaurants(newEmployeeRestaurants.filter((id) => id !== restaurantId))
    } else {
      setNewEmployeeRestaurants([...newEmployeeRestaurants, restaurantId])
    }
  }

  // =========================================================================
  // HANDLERS: EMPLOYEE STATUS
  // =========================================================================

  const handleToggleEmployeeStatus = async (employeeId: number, currentStatus: string) => {
    try {
      setLoading(true)
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      await updateEmployeeStatus(employeeId, newStatus as 'active' | 'inactive')
      showSnackbar('Employee status updated', 'success')
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update employee status'
      showSnackbar(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // =========================================================================
  // HANDLERS: ASSIGNMENTS
  // =========================================================================

  const handleAssignDialogOpen = (employee: Employee) => {
    setSelectedEmployee(employee)
    setSelectedRestaurantForAssign(null)
    setAssignDialogOpen(true)
  }

  const handleAssignDialogClose = () => {
    setAssignDialogOpen(false)
    setSelectedEmployee(null)
    setSelectedRestaurantForAssign(null)
  }

  const handleAddAssignment = async () => {
    if (!selectedEmployee || !selectedRestaurantForAssign) {
      showSnackbar('Please select a restaurant', 'error')
      return
    }

    try {
      setLoading(true)
      await addAssignment(selectedRestaurantForAssign, selectedEmployee.id)
      showSnackbar('Employee assigned to restaurant', 'success')
      handleAssignDialogClose()
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign employee'
      showSnackbar(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) {
      return
    }

    try {
      setLoading(true)
      await deleteAssignment(assignmentId)
      showSnackbar('Assignment removed', 'success')
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove assignment'
      showSnackbar(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  if (loading && employees.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Employee Management
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage employees and their restaurant assignments
        </Typography>
      </Box>

      {/* Action Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleCreateDialogOpen}>
          Create Employee
        </Button>
        <TextField
          placeholder="Search employees by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 250 }}
        />
      </Box>

      {/* Employees List */}
      <Stack spacing={2}>
        {filteredEmployees.length === 0 ? (
          <Card sx={{ p: 3 }}>
            <Typography align="center" color="textSecondary">
              {searchTerm ? 'No employees match your search' : 'No employees yet. Click "Create Employee" to add one.'}
            </Typography>
          </Card>
        ) : (
          filteredEmployees.map((employee) => {
            const empRestaurants = getEmployeeRestaurants(employee.id)
            const empAssignments = assignments.filter((a) => a.employee_id === employee.id)

            return (
              <Card key={employee.id} sx={{ p: 3 }}>
                {/* Employee Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {employee.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {employee.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={employee.status === 'active'}
                          onChange={() => handleToggleEmployeeStatus(employee.id, employee.status)}
                        />
                      }
                      label={employee.status === 'active' ? 'Active' : 'Inactive'}
                    />
                  </Box>
                </Box>

                {/* Assigned Restaurants */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Assigned Restaurants ({empRestaurants.length})
                  </Typography>
                  {empRestaurants.length === 0 ? (
                    <Typography variant="body2" color="textSecondary">
                      Not assigned to any restaurants
                    </Typography>
                  ) : (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {empRestaurants.map((rest) => {
                        const assignment = empAssignments.find((a) => a.restaurant_id === rest.id)
                        return (
                          <Chip
                            key={rest.id}
                            label={rest.name}
                            onDelete={() => assignment && handleRemoveAssignment(assignment.id)}
                            color="primary"
                            variant="outlined"
                          />
                        )
                      })}
                    </Stack>
                  )}
                </Box>

                {/* Assign More Restaurants Button */}
                {getUnassignedRestaurants(employee.id).length > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleAssignDialogOpen(employee)}
                  >
                    Assign Restaurant
                  </Button>
                )}
              </Card>
            )
          })
        )}
      </Stack>

      {/* CREATE EMPLOYEE DIALOG */}
      <Dialog open={createDialogOpen} onClose={handleCreateDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Employee</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            <TextField
              label="Name"
              fullWidth
              value={newEmployeeName}
              onChange={(e) => setNewEmployeeName(e.target.value)}
              placeholder="Employee full name"
            />
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={newEmployeeEmail}
              onChange={(e) => setNewEmployeeEmail(e.target.value)}
              placeholder="employee@example.com"
            />
            <TextField
              label="Password"
              fullWidth
              type="password"
              value={newEmployeePassword}
              onChange={(e) => setNewEmployeePassword(e.target.value)}
              placeholder="Set initial password"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={newEmployeeStatus === 'active'}
                  onChange={(e) => setNewEmployeeStatus(e.target.checked ? 'active' : 'inactive')}
                />
              }
              label={newEmployeeStatus === 'active' ? 'Active' : 'Inactive'}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Initial Restaurant Assignments (optional)
              </Typography>
              <Stack spacing={1}>
                {restaurants.map((rest) => (
                  <FormControlLabel
                    key={rest.id}
                    control={
                      <Checkbox
                        checked={newEmployeeRestaurants.includes(rest.id)}
                        onChange={() => toggleRestaurantSelection(rest.id)}
                      />
                    }
                    label={rest.name}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateDialogClose}>Cancel</Button>
          <Button onClick={handleCreateEmployee} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* ASSIGN RESTAURANT DIALOG */}
      <Dialog open={assignDialogOpen} onClose={handleAssignDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Restaurant to {selectedEmployee?.name}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedEmployee && getUnassignedRestaurants(selectedEmployee.id).length === 0 ? (
            <Typography color="textSecondary">All restaurants are already assigned to this employee.</Typography>
          ) : (
            <Stack spacing={1}>
              {selectedEmployee &&
                getUnassignedRestaurants(selectedEmployee.id).map((rest) => (
                  <Button
                    key={rest.id}
                    fullWidth
                    variant={selectedRestaurantForAssign === rest.id ? 'contained' : 'outlined'}
                    onClick={() => setSelectedRestaurantForAssign(rest.id)}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    {rest.name}
                  </Button>
                ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAssignDialogClose}>Cancel</Button>
          <Button onClick={handleAddAssignment} variant="contained" color="primary" disabled={!selectedRestaurantForAssign}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default Users
