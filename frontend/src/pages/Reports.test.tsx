import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Reports from './Reports'
import { fetchSales } from '../lib/api'
import { RestaurantContext } from '../context/RestaurantContext'
import type { RestaurantContextType } from '../context/RestaurantContext'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>()
  return {
    ...actual,
    fetchSales: vi.fn(),
  }
})

const mockedFetchSales = vi.mocked(fetchSales)

function renderReports() {
  const value: RestaurantContextType = {
    restaurants: [
      { id: 1, name: 'Indian Restaurant Mina - Asakawa' },
      { id: 2, name: 'Indian Restaurant Mina - Tobata' },
    ],
    selectedRestaurant: null,
    setSelectedRestaurant: vi.fn(),
    setRestaurants: vi.fn(),
    refreshRestaurants: vi.fn().mockResolvedValue(undefined),
    addRestaurant: vi.fn(),
    updateRestaurant: vi.fn(),
    deleteRestaurant: vi.fn(),
  }

  return render(
    <RestaurantContext.Provider value={value}>
      <Reports />
    </RestaurantContext.Provider>,
  )
}

describe('Reports page', () => {
  beforeEach(() => {
    mockedFetchSales.mockResolvedValue([
      {
        id: 1,
        employee_id: 1,
        restaurant_id: 1,
        restaurant_name: 'Indian Restaurant Mina - Asakawa',
        date: '2026-03-24',
        lunch_head_count: 10,
        lunch_sale: 200,
        dinner_head_count: 8,
        dinner_sale: 300,
        credit_sale: 150,
        reji_money: 350,
        expenditures: [{ title: 'Vegetables', amount: 40 }],
        note: '',
        created_at: '2026-03-24T00:00:00Z',
      },
    ])
  })

  it('renders the monthly grid with the accountant-style columns', async () => {
    renderReports()

    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '2026-03' } })

    expect(await screen.findByText('March 2026')).toBeInTheDocument()
    expect(screen.getAllByText('TOTAL').length).toBeGreaterThan(0)
    expect(screen.getByText('CREDIT')).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('200'))).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('500'))).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('150'))).toBeInTheDocument()
  })

  it('refetches reports for a selected restaurant', async () => {
    const user = userEvent.setup()
    renderReports()

    await screen.findByText('Monthly restaurant report view.')
    mockedFetchSales.mockClear()

    const restaurantSelect = screen.getByRole('combobox', { name: /restaurant/i })
    await user.click(restaurantSelect)
    await user.click(await screen.findByRole('option', { name: /tobata/i }))

    await waitFor(() => {
      expect(mockedFetchSales).toHaveBeenCalledWith(
        expect.objectContaining({ restaurantId: 2 }),
      )
    })
  })

  it('opens a day detail popup when a report date is clicked', async () => {
    const user = userEvent.setup()
    renderReports()

    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '2026-03' } })

    await user.click(await screen.findByRole('button', { name: /24/ }))

    expect(await screen.findByText(/Lunch Sale:/i)).toBeInTheDocument()
    expect(screen.getByText(/Dinner Sale:/i)).toBeInTheDocument()
    expect(screen.getByText(/Credit Sale:/i)).toBeInTheDocument()
    expect(screen.getByText(/Reji Money:/i)).toBeInTheDocument()
    expect(screen.getByText(/Bank Deposit:/i)).toBeInTheDocument()
    expect(screen.getByText(/Vegetables/i)).toBeInTheDocument()
  })

  it('shows an error state when report loading fails', async () => {
    mockedFetchSales.mockRejectedValueOnce(new Error('Failed to fetch reports'))

    renderReports()

    expect(await screen.findByText('Failed to fetch reports')).toBeInTheDocument()
  })
})
