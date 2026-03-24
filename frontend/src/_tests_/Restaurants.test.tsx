import { vi, type Mock } from 'vitest'
import { useRestaurant } from '../context/useRestaurant'

vi.mock('../context/useRestaurant', () => ({
  useRestaurant: vi.fn(),
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Restaurants from '../pages/Restaurants'

const mockedUseRestaurant = useRestaurant as unknown as Mock

test('shows empty state when no restaurants', async () => {
  mockedUseRestaurant.mockReturnValue({
    restaurants: [],
    refreshRestaurants: vi.fn().mockResolvedValue([]),
    addRestaurant: vi.fn(),
    updateRestaurant: vi.fn(),
    deleteRestaurant: vi.fn(),
  })

  render(<Restaurants />)

  expect(await screen.findByText(/no restaurants added yet/i)).toBeInTheDocument()
})

test('renders restaurants in table', async () => {
  mockedUseRestaurant.mockReturnValue({
    restaurants: [{ id: 1, name: 'Test Restaurant' }],
    refreshRestaurants: vi.fn().mockResolvedValue([]),
    addRestaurant: vi.fn(),
    updateRestaurant: vi.fn(),
    deleteRestaurant: vi.fn(),
  })

  render(<Restaurants />)

  expect(await screen.findByText('Test Restaurant')).toBeInTheDocument()
})

test('opens add restaurant dialog', async () => {
  mockedUseRestaurant.mockReturnValue({
    restaurants: [],
    refreshRestaurants: vi.fn().mockResolvedValue([]),
    addRestaurant: vi.fn(),
    updateRestaurant: vi.fn(),
    deleteRestaurant: vi.fn(),
  })

  render(<Restaurants />)

  fireEvent.click(screen.getByRole('button', { name: /add restaurant/i }))

  expect(await screen.findByText(/add new restaurant/i)).toBeInTheDocument()
})

test('adds a restaurant', async () => {
  const addRestaurant = vi.fn().mockResolvedValue({})
  mockedUseRestaurant.mockReturnValue({
    restaurants: [],
    refreshRestaurants: vi.fn().mockResolvedValue([]),
    addRestaurant,
    updateRestaurant: vi.fn(),
    deleteRestaurant: vi.fn(),
  })

  render(<Restaurants />)

  fireEvent.click(screen.getByRole('button', { name: /add restaurant/i }))

  fireEvent.change(
    screen.getByLabelText(/restaurant name\/location/i),
    { target: { value: 'New Place' } }
  )

  fireEvent.click(screen.getByRole('button', { name: /^add$/i }))

  await waitFor(() => {
    expect(addRestaurant).toHaveBeenCalledWith('New Place')
  })
})

test('deletes a restaurant', async () => {
  const deleteRestaurant = vi.fn().mockResolvedValue({})
  mockedUseRestaurant.mockReturnValue({
    restaurants: [{ id: 1, name: 'Test Restaurant' }],
    refreshRestaurants: vi.fn().mockResolvedValue([]),
    addRestaurant: vi.fn(),
    updateRestaurant: vi.fn(),
    deleteRestaurant,
  })

  render(<Restaurants />)

  // click delete icon
  fireEvent.click(await screen.findByTitle(/delete restaurant/i))

  // confirm dialog
  fireEvent.click(screen.getByRole('button', { name: /delete/i }))

  await waitFor(() => {
    expect(deleteRestaurant).toHaveBeenCalledWith(1)
  })
})