import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Restaurants from '../pages/Restaurants'
import { RestaurantContext } from '../context/RestaurantContext'
import type { RestaurantContextType } from '../context/RestaurantContext'
import { getEmployees } from '../lib/api'

vi.mock('../lib/api', () => ({
  getEmployees: vi.fn(),
}))

const mockedGetEmployees = vi.mocked(getEmployees)

function renderRestaurantsPage(overrides: Partial<RestaurantContextType> = {}) {
  const value: RestaurantContextType = {
    restaurants: [
      { id: 1, name: 'Indian Restaurant Mina - Asakawa', created_at: '2026-04-20T12:00:00Z' },
      { id: 2, name: 'Indian Restaurant Mina - Tobata', created_at: '2026-04-19T12:00:00Z' },
    ],
    selectedRestaurant: null,
    setSelectedRestaurant: vi.fn(),
    setRestaurants: vi.fn(),
    refreshRestaurants: vi.fn().mockResolvedValue(undefined),
    addRestaurant: vi.fn().mockResolvedValue({ id: 3, name: 'Indian Restaurant Mina - Shingu' }),
    updateRestaurant: vi.fn().mockResolvedValue({ id: 1, name: 'Updated Restaurant' }),
    deleteRestaurant: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }

  return {
    ...render(
      <RestaurantContext.Provider value={value}>
        <Restaurants />
      </RestaurantContext.Provider>,
    ),
    context: value,
  }
}

describe('Restaurants page', () => {
  beforeEach(() => {
    mockedGetEmployees.mockResolvedValue([
      {
        id: 7,
        name: 'Ryan Sharma',
        email: 'ryan@example.com',
        status: 'active',
        restaurants: [{ id: 1, name: 'Indian Restaurant Mina - Asakawa' }],
        created_at: '2026-04-18T09:00:00Z',
      },
    ] as any)
  })

  it('adds a restaurant from the dialog', async () => {
    const user = userEvent.setup()
    const { context } = renderRestaurantsPage()

    await screen.findByText('Indian Restaurant Mina - Asakawa')
    await user.click(screen.getByRole('button', { name: /add restaurant/i }))
    await user.type(screen.getByLabelText(/restaurant name\/location/i), 'Indian Restaurant Mina - Shingu')
    await user.click(screen.getByRole('button', { name: /^add$/i }))

    await waitFor(() => {
      expect(context.addRestaurant).toHaveBeenCalledWith('Indian Restaurant Mina - Shingu')
    })
  })

  it('opens edit mode with the existing restaurant name and saves the update', async () => {
    const user = userEvent.setup()
    const { context } = renderRestaurantsPage()

    await screen.findByText('Indian Restaurant Mina - Asakawa')
    await user.click(screen.getAllByRole('button', { name: /edit /i })[0])

    const nameInput = screen.getByLabelText(/restaurant name\/location/i)
    expect(nameInput).toHaveValue('Indian Restaurant Mina - Asakawa')

    await user.clear(nameInput)
    await user.type(nameInput, 'Indian Restaurant Mina - Asakawa Updated')
    await user.click(screen.getByRole('button', { name: /update/i }))

    await waitFor(() => {
      expect(context.updateRestaurant).toHaveBeenCalledWith(1, 'Indian Restaurant Mina - Asakawa Updated')
    })
  })

  it('deletes a restaurant after confirmation', async () => {
    const user = userEvent.setup()
    const { context } = renderRestaurantsPage()

    await screen.findByText('Indian Restaurant Mina - Asakawa')
    await user.click(screen.getAllByRole('button', { name: /delete /i })[0])
    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(context.deleteRestaurant).toHaveBeenCalledWith(1)
    })
  })
})
