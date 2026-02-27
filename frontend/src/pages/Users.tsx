import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
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
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Container,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getRestaurants, type Restaurant } from './Restaurants';

// ============================================================================
// TYPES
// ============================================================================

type Employee = {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
};

type Assignment = {
  id: string;
  restaurantId: string;
  employeeId: string;
  status: 'active' | 'inactive';
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
};

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Alice Johnson', email: 'alice@example.com', status: 'active' },
  { id: 'emp-2', name: 'Bob Smith', email: 'bob@example.com', status: 'active' },
  { id: 'emp-3', name: 'Carol Davis', email: 'carol@example.com', status: 'inactive' },
  { id: 'emp-4', name: 'David Wilson', email: 'david@example.com', status: 'active' },
  { id: 'emp-5', name: 'Eva Martinez', email: 'eva@example.com', status: 'active' },
  { id: 'emp-6', name: 'Frank Brown', email: 'frank@example.com', status: 'active' },
];

const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 'assign-1', restaurantId: '1', employeeId: 'emp-1', status: 'active' },
  { id: 'assign-2', restaurantId: '2', employeeId: 'emp-2', status: 'active' },
  { id: 'assign-3', restaurantId: '3', employeeId: 'emp-3', status: 'inactive' },
  { id: 'assign-4', restaurantId: '4', employeeId: 'emp-4', status: 'active' },
  { id: 'assign-5', restaurantId: '5', employeeId: 'emp-5', status: 'active' },
  { id: 'assign-6', restaurantId: '6', employeeId: 'emp-6', status: 'inactive' },
];

// ============================================================================
// UTILS
// ============================================================================

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============================================================================
// USERS PAGE COMPONENT
// ============================================================================

export const Users: React.FC = () => {
  // TODO: Add manager-only access control in production
  
  // =========================================================================
  // STATE
  // =========================================================================

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [employees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [assignments, setAssignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS);

  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  // Form states
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isAddingNewRestaurant, setIsAddingNewRestaurant] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isActive, setIsActive] = useState(true);

  // Load restaurants from Restaurants page and sync on changes
  useEffect(() => {
    const loadedRestaurants = getRestaurants();
    setRestaurants(loadedRestaurants);

    // Sync assignments when restaurants change
    setAssignments((prevAssignments) => {
      // Filter out assignments for deleted restaurants
      const validAssignments = prevAssignments.filter((assignment) =>
        loadedRestaurants.some((r) => r.id === assignment.restaurantId)
      );

      // Find new restaurants that don't have assignments yet
      const newRestaurants = loadedRestaurants.filter(
        (restaurant) =>
          !prevAssignments.some((a) => a.restaurantId === restaurant.id)
      );

      // Create assignments for new restaurants with default employees
      const defaultEmployeeIds = MOCK_EMPLOYEES.map((emp) => emp.id);
      const newAssignments = newRestaurants.flatMap((restaurant, restaurantIndex) => {
        // Assign 1 employee per new restaurant (cycling through employees)
        const employeeId = defaultEmployeeIds[restaurantIndex % defaultEmployeeIds.length];
        return {
          id: `assign-${Date.now()}-${restaurantIndex}`,
          restaurantId: restaurant.id,
          employeeId,
          status: 'active' as const,
        };
      });

      return [...validAssignments, ...newAssignments];
    });

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'prepsheet_restaurants') {
        const updatedRestaurants = getRestaurants();
        setRestaurants(updatedRestaurants);

        setAssignments((prevAssignments) => {
          // Filter out assignments for deleted restaurants
          const validAssignments = prevAssignments.filter((assignment) =>
            updatedRestaurants.some((r) => r.id === assignment.restaurantId)
          );

          // Find new restaurants
          const newRestaurants = updatedRestaurants.filter(
            (restaurant) =>
              !prevAssignments.some((a) => a.restaurantId === restaurant.id)
          );

          // Create assignments for new restaurants
          const defaultEmployeeIds = MOCK_EMPLOYEES.map((emp) => emp.id);
          const newAssignments = newRestaurants.flatMap((restaurant, restaurantIndex) => {
            const employeeId = defaultEmployeeIds[restaurantIndex % defaultEmployeeIds.length];
            return {
              id: `assign-${Date.now()}-${restaurantIndex}`,
              restaurantId: restaurant.id,
              employeeId,
              status: 'active' as const,
            };
          });

          return [...validAssignments, ...newAssignments];
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // =========================================================================
  // HELPER FUNCTIONS
  // =========================================================================

  const getRestaurantName = (restaurantId: string): string => {
    return restaurants.find((r) => r.id === restaurantId)?.name || 'Unknown';
  };

  const getEmployeeInfo = (employeeId: string): Employee | undefined => {
    return employees.find((e) => e.id === employeeId);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // =========================================================================
  // FILTERED DATA
  // =========================================================================

  const filteredAssignments = useMemo(() => {
    if (!searchTerm) return assignments;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return assignments.filter((assignment) => {
      const restaurantName = getRestaurantName(assignment.restaurantId).toLowerCase();
      const employee = getEmployeeInfo(assignment.employeeId);
      const employeeName = employee?.name.toLowerCase() || '';
      const employeeEmail = employee?.email.toLowerCase() || '';

      return (
        restaurantName.includes(lowerSearchTerm) ||
        employeeName.includes(lowerSearchTerm) ||
        employeeEmail.includes(lowerSearchTerm)
      );
    });
  }, [assignments, searchTerm]);

  // =========================================================================
  // DIALOG HANDLERS
  // =========================================================================

  const handleAddClick = () => {
    setSelectedAssignmentId(null);
    setSelectedRestaurant(null);
    setIsAddingNewRestaurant(false);
    setNewRestaurantName('');
    setSelectedEmployee(null);
    setIsActive(true);
    setIsDialogOpen(true);
  };

  const handleEditClick = (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return;

    setSelectedAssignmentId(assignmentId);
    setSelectedRestaurant(restaurants.find((r) => r.id === assignment.restaurantId) || null);
    setIsAddingNewRestaurant(false);
    setNewRestaurantName('');
    setSelectedEmployee(employees.find((e) => e.id === assignment.employeeId) || null);
    setIsActive(assignment.status === 'active');
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedAssignmentId(null);
    setSelectedRestaurant(null);
    setIsAddingNewRestaurant(false);
    setNewRestaurantName('');
    setSelectedEmployee(null);
    setIsActive(true);
  };

  const handleDialogSave = () => {
    // Validation
    let restaurant = selectedRestaurant;

    if (isAddingNewRestaurant) {
      if (!newRestaurantName.trim()) {
        showSnackbar('Please enter a restaurant name', 'error');
        return;
      }
      // Create new restaurant
      restaurant = { id: generateId('rest'), name: newRestaurantName.trim() };
      setRestaurants([...restaurants, restaurant]);
    }

    if (!restaurant) {
      showSnackbar('Please select or create a restaurant', 'error');
      return;
    }

    if (!selectedEmployee) {
      showSnackbar('Please select an employee', 'error');
      return;
    }

    if (selectedAssignmentId) {
      // EDIT
      setAssignments(
        assignments.map((a) =>
          a.id === selectedAssignmentId
            ? {
                ...a,
                restaurantId: restaurant.id,
                employeeId: selectedEmployee.id,
                status: isActive ? 'active' : 'inactive',
              }
            : a
        )
      );
      showSnackbar('Assignment updated successfully', 'success');
    } else {
      // ADD
      const newAssignment: Assignment = {
        id: generateId('assign'),
        restaurantId: restaurant.id,
        employeeId: selectedEmployee.id,
        status: isActive ? 'active' : 'inactive',
      };
      setAssignments([...assignments, newAssignment]);
      showSnackbar('Assignment added successfully', 'success');
    }

    handleDialogClose();
  };

  // =========================================================================
  // REMOVE HANDLERS
  // =========================================================================

  const handleRemoveClick = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmRemove = () => {
    if (selectedAssignmentId) {
      setAssignments(assignments.filter((a) => a.id !== selectedAssignmentId));
      showSnackbar('Assignment removed successfully', 'success');
      setIsConfirmDialogOpen(false);
      setSelectedAssignmentId(null);
    }
  };

  const handleCancelRemove = () => {
    setIsConfirmDialogOpen(false);
    setSelectedAssignmentId(null);
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Users / Assignments
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage restaurant-to-employee assignments for data entry duties
        </Typography>
      </Box>

      {/* Action Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button variant="contained" color="primary" onClick={handleAddClick}>
          + Add Assignment
        </Button>
        <TextField
          placeholder="Search by restaurant or employee name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 250 }}
        />
      </Box>

      {/* Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Restaurant</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Assigned Employee</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment) => {
                  const restaurant = restaurants.find((r) => r.id === assignment.restaurantId);
                  const employee = employees.find((e) => e.id === assignment.employeeId);

                  return (
                    <TableRow key={assignment.id} hover>
                      <TableCell>{restaurant?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {employee?.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {employee?.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={assignment.status === 'active' ? 'Active' : 'Inactive'}
                          color={assignment.status === 'active' ? 'success' : 'default'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditClick(assignment.id)}
                            title="Edit assignment"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveClick(assignment.id)}
                            title="Remove assignment"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      {searchTerm ? 'No assignments match your search' : 'No assignments yet'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isDialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedAssignmentId ? 'Edit Assignment' : 'Add Assignment'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            {/* Restaurant Selection */}
            <FormControl fullWidth>
              <InputLabel>Restaurant</InputLabel>
              <Select
                value={isAddingNewRestaurant ? 'NEW' : selectedRestaurant?.id || ''}
                onChange={(e) => {
                  if (e.target.value === 'NEW') {
                    setIsAddingNewRestaurant(true);
                    setSelectedRestaurant(null);
                  } else {
                    setIsAddingNewRestaurant(false);
                    const restaurant = restaurants.find((r) => r.id === e.target.value);
                    setSelectedRestaurant(restaurant || null);
                  }
                }}
                label="Restaurant"
              >
                {restaurants.map((restaurant) => (
                  <MenuItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </MenuItem>
                ))}
                <MenuItem value="NEW">+ Add new restaurant</MenuItem>
              </Select>
            </FormControl>

            {/* New Restaurant Name Input */}
            {isAddingNewRestaurant && (
              <TextField
                label="New Restaurant Name"
                placeholder="Enter restaurant name"
                value={newRestaurantName}
                onChange={(e) => setNewRestaurantName(e.target.value)}
                fullWidth
              />
            )}

            {/* Employee Selection with Autocomplete */}
            <Autocomplete
              options={employees}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              value={selectedEmployee}
              onChange={(_, newValue) => setSelectedEmployee(newValue)}
              renderInput={(params) => <TextField {...params} label="Employee" />}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
            />

            {/* Status Toggle */}
            <FormControlLabel
              control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
              label={isActive ? 'Active' : 'Inactive'}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleDialogSave} variant="contained" color="primary">
            {selectedAssignmentId ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRM REMOVE DIALOG */}
      <Dialog open={isConfirmDialogOpen} onClose={handleCancelRemove} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Assignment</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this assignment? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRemove}>Cancel</Button>
          <Button onClick={handleConfirmRemove} variant="contained" color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Users;
