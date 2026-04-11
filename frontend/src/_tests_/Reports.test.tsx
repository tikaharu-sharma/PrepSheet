import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Reports from '../pages/Reports'
import { fetchSales, type SaleRecord } from '../lib/api'
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

const reportSalesByRestaurant: Record<number, SaleRecord[]> = {
  1: [
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
    {
      id: 2,
      employee_id: 1,
      restaurant_id: 1,
      restaurant_name: 'Indian Restaurant Mina - Asakawa',
      date: '2026-04-03',
      lunch_head_count: 30,
      lunch_sale: 30000,
      dinner_head_count: 45,
      dinner_sale: 50000,
      credit_sale: 50000,
      reji_money: 30000,
      expenditures: [],
      note: '',
      created_at: '2026-04-03T00:00:00Z',
    },
  ],
  2: [
    {
      id: 3,
      employee_id: 2,
      restaurant_id: 2,
      restaurant_name: 'Indian Restaurant Mina - Tobata',
      date: '2025-11-11',
      lunch_head_count: 12,
      lunch_sale: 1200,
      dinner_head_count: 10,
      dinner_sale: 1400,
      credit_sale: 500,
      reji_money: 2100,
      expenditures: [],
      note: '',
      created_at: '2025-11-11T00:00:00Z',
    },
  ],
}

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
    mockedFetchSales.mockImplementation(async (params) => {
      if (!params?.restaurantId) {
        return []
      }

      return reportSalesByRestaurant[params.restaurantId] ?? []
    })
  })

  it('renders the monthly grid with the accountant-style columns', async () => {
    const user = userEvent.setup()
    renderReports()

    await screen.findByText('Monthly restaurant report view.')

    await user.click(screen.getByRole('combobox', { name: /month/i }))
    await user.click(await screen.findByRole('option', { name: 'March' }))

    expect(await screen.findByText(/March\s+2026/i)).toBeInTheDocument()
    expect(screen.getAllByText('TOTAL').length).toBeGreaterThan(0)
    expect(screen.getByText('CREDIT')).toBeInTheDocument()
    expect(screen.getAllByText((content) => content.includes("200")).length).toBeGreaterThan(0)
    expect(screen.getAllByText((content) => content.includes("500")).length).toBeGreaterThan(0)
    expect(screen.getAllByText((content) => content.includes("150")).length).toBeGreaterThan(0)
   // expect(screen.getByText((content) => content.includes('200'))).toBeInTheDocument()
   // expect(screen.getByText((content) => content.includes('500'))).toBeInTheDocument()
   // expect(screen.getByText((content) => content.includes('150'))).toBeInTheDocument()
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
      expect(mockedFetchSales).toHaveBeenLastCalledWith(
        expect.objectContaining({ restaurantId: 2 }),
      )
    })
  })

  it('shows only available years and months for the selected restaurant', async () => {
    const user = userEvent.setup()
    renderReports()

    await screen.findByText('Monthly restaurant report view.')

    await user.click(screen.getAllByRole('combobox')[0])
    expect(await screen.findByRole('option', { name: '2026' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '2025' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')

    await user.click(screen.getAllByRole('combobox')[1])
    expect(await screen.findByRole('option', { name: 'April' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'March' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'February' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('combobox', { name: /restaurant/i }))
    await user.click(await screen.findByRole('option', { name: /tobata/i }))

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[0]).toHaveTextContent('2025')
    })

    await user.click(screen.getAllByRole('combobox')[0])
    expect(await screen.findByRole('option', { name: '2025' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '2026' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')

    await user.click(screen.getAllByRole('combobox')[1])
    expect(await screen.findByRole('option', { name: 'November' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'March' })).not.toBeInTheDocument()
  })

  it('opens a day detail popup when a report date is clicked', async () => {
    const user = userEvent.setup()
    renderReports()

    await screen.findByText('Monthly restaurant report view.')

    await user.click(screen.getByRole('combobox', { name: /month/i }))
    await user.click(await screen.findByRole('option', { name: 'March' }))

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
