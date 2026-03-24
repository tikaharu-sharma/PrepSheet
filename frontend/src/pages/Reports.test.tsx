import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Reports from './Reports'
import { fetchMonthlyReport, fetchSales } from '../lib/api'
import { RestaurantContext } from '../context/RestaurantContext'
import type { RestaurantContextType } from '../context/RestaurantContext'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>()
  return {
    ...actual,
    fetchSales: vi.fn(),
    fetchMonthlyReport: vi.fn(),
  }
})

const mockedFetchSales = vi.mocked(fetchSales)
const mockedFetchMonthlyReport = vi.mocked(fetchMonthlyReport)

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
    mockedFetchMonthlyReport.mockResolvedValue({
      month: '2026-03',
      total_sales: 500,
      total_lunch: 200,
      total_dinner: 300,
      entry_count: 1,
    })
  })

  it('renders monthly totals and the computed total sale column', async () => {
    renderReports()

    expect((await screen.findAllByText('$500.00')).length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('$200.00').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('$300.00').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('$40.00')).toBeInTheDocument()
    expect(screen.getAllByText('$500.00').length).toBeGreaterThan(0)
  })

  it('refetches reports for a selected restaurant', async () => {
    const user = userEvent.setup()
    renderReports()

    await screen.findByText('Daily Sales Entries')
    mockedFetchSales.mockClear()
    mockedFetchMonthlyReport.mockClear()

    const restaurantSelect = screen.getByRole('combobox', { name: /restaurant/i })
    await user.click(restaurantSelect)
    await user.click(await screen.findByRole('option', { name: /tobata/i }))

    await waitFor(() => {
      expect(mockedFetchSales).toHaveBeenCalledWith(
        expect.objectContaining({ restaurantId: 2 }),
      )
      expect(mockedFetchMonthlyReport).toHaveBeenCalledWith(expect.any(String), 2)
    })
  })

  it('shows an error state when report loading fails', async () => {
    mockedFetchSales.mockRejectedValueOnce(new Error('Failed to fetch reports'))
    mockedFetchMonthlyReport.mockResolvedValueOnce({
      month: '2026-03',
      total_sales: 0,
      total_lunch: 0,
      total_dinner: 0,
      entry_count: 0,
    })

    renderReports()

    expect(await screen.findByText('Failed to fetch reports')).toBeInTheDocument()
  })
})
