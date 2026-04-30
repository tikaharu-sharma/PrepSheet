import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Users } from '../pages/Users'
import {
  createEmployee,
  deleteEmployee,
  fetchRestaurants,
  getAssignments,
  getEmployees,
  updateEmployee,
  addAssignment,
  deleteAssignment,
} from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>()
  return {
    ...actual,
    getEmployees: vi.fn(),
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    deleteEmployee: vi.fn(),
    getAssignments: vi.fn(),
    fetchRestaurants: vi.fn(),
    addAssignment: vi.fn(),
    deleteAssignment: vi.fn(),
  }
})

const mockedGetEmployees = vi.mocked(getEmployees)
const mockedCreateEmployee = vi.mocked(createEmployee)
const mockedUpdateEmployee = vi.mocked(updateEmployee)
const mockedDeleteEmployee = vi.mocked(deleteEmployee)
const mockedGetAssignments = vi.mocked(getAssignments)
const mockedFetchRestaurants = vi.mocked(fetchRestaurants)
const mockedAddAssignment = vi.mocked(addAssignment)
const mockedDeleteAssignment = vi.mocked(deleteAssignment)

const employees = [
  {
    id: 10,
    name: 'John Employee',
    email: 'john@example.com',
    status: 'active' as const,
    restaurants: [],
    created_at: '2026-03-24T00:00:00Z',
  },
]

const restaurants = [
  { id: 1, name: 'Indian Restaurant Mina - Asakawa' },
  { id: 2, name: 'Indian Restaurant Mina - Tobata' },
]

const assignments = [
  {
    id: 100,
    restaurant_id: 1,
    restaurant_name: 'Indian Restaurant Mina - Asakawa',
    employee_id: 10,
    employee_name: 'John Employee',
    employee_email: 'john@example.com',
    status: 'active' as const,
    created_at: '2026-03-24T00:00:00Z',
  },
]

describe('Users page', () => {
  beforeEach(() => {
    mockedGetEmployees.mockResolvedValue(employees)
    mockedGetAssignments.mockResolvedValue(assignments)
    mockedFetchRestaurants.mockResolvedValue(restaurants)
    mockedCreateEmployee.mockResolvedValue({ id: 11, message: 'created' })
    mockedUpdateEmployee.mockResolvedValue({ message: 'updated' })
    mockedDeleteEmployee.mockResolvedValue({ message: 'deleted' })
    mockedAddAssignment.mockResolvedValue({ id: 200, message: 'assigned' })
    mockedDeleteAssignment.mockResolvedValue({ message: 'deleted' })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a new employee with selected restaurants', async () => {
    const user = userEvent.setup()
    render(<Users />)

    await screen.findByText('John Employee')
    await user.click(screen.getByRole('button', { name: /create employee/i }))
    await user.type(screen.getByLabelText(/^name$/i), 'Jane Employee')
    await user.type(screen.getByLabelText(/email \/ username/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'secret123')
    await user.click(screen.getByLabelText(/indian restaurant mina - tobata/i))
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => {
      expect(mockedCreateEmployee).toHaveBeenCalledWith({
        name: 'Jane Employee',
        email: 'jane@example.com',
        password: 'secret123',
        status: 'active',
        restaurants: [2],
      })
    })
  })

  it('edits an employee and submits the updated fields', async () => {
    const user = userEvent.setup()
    render(<Users />)

    await screen.findByText('John Employee')
    await user.click(screen.getByRole('button', { name: /^edit$/i }))

    const nameInput = screen.getByLabelText(/^name$/i)
    const emailInput = screen.getByLabelText(/email/i)
    expect(nameInput).toHaveValue('John Employee')
    expect(emailInput).toHaveValue('john@example.com')

    await user.clear(nameInput)
    await user.type(nameInput, 'John Updated')
    await user.clear(emailInput)
    await user.type(emailInput, 'john.updated@example.com')
    await user.click(screen.getByRole('button', { name: /^save changes$/i }))

    await waitFor(() => {
      expect(mockedUpdateEmployee).toHaveBeenCalledWith({
        user_id: 10,
        name: 'John Updated',
        email: 'john.updated@example.com',
      })
    })
  })

  it('deletes an employee after confirmation', async () => {
    const user = userEvent.setup()
    render(<Users />)

    await screen.findByText('John Employee')
    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(mockedDeleteEmployee).toHaveBeenCalledWith(10)
    })
  })

  it('assigns a restaurant to an employee', async () => {
    const user = userEvent.setup()
    render(<Users />)

    await screen.findByText('John Employee')

    await user.click(screen.getByRole('button', { name: /assign restaurant/i }))
    await user.click(screen.getByText('Indian Restaurant Mina - Tobata'))
    await user.click(screen.getByRole('button', { name: /^assign$/i }))

    await waitFor(() => {
      expect(mockedAddAssignment).toHaveBeenCalledWith(2, 10)
    })
  })

  it('filters employees using search input', async () => {
    const user = userEvent.setup()
    render(<Users />)

    await screen.findByText('John Employee')

    const search = screen.getByPlaceholderText(/search employees/i)
    await user.type(search, 'john')

    expect(screen.getByText('John Employee')).toBeInTheDocument()
  })
})
