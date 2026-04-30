import { render, screen, waitFor } from '@testing-library/react'
import Dashboard from '../pages/Dashboard'
import { RestaurantContext, type RestaurantContextType } from '../context/RestaurantContext'
import { fetchSales, type SaleRecord } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>()
  return {
    ...actual,
    fetchSales: vi.fn(),
  }
})

vi.mock('../components/dashboard/SalesTrendChart', () => ({
  default: () => <div>Sales Trend Chart</div>,
}))

vi.mock('../components/dashboard/DashboardSummaryCards', () => ({
  default: () => <div>Dashboard Summary</div>,
}))

const mockedFetchSales = vi.mocked(fetchSales)

const restaurantContextValue: RestaurantContextType = {
  restaurants: [{ id: 1, name: 'Downtown' }],
  selectedRestaurant: null,
  setSelectedRestaurant: vi.fn(),
  setRestaurants: vi.fn(),
  refreshRestaurants: vi.fn(),
  addRestaurant: vi.fn(),
  updateRestaurant: vi.fn(),
  deleteRestaurant: vi.fn(),
}

const sales: SaleRecord[] = [
  {
    id: 1,
    employee_id: 1,
    restaurant_id: 1,
    restaurant_name: 'Downtown',
    date: '2026-04-10',
    lunch_head_count: 10,
    lunch_sale: 1200,
    dinner_head_count: 8,
    dinner_sale: 1500,
    credit_sale: 0,
    reji_money: 0,
    expenditures: [],
    note: '',
    created_at: '2026-04-10T00:00:00Z',
  },
]

describe('Dashboard page', () => {
  beforeEach(() => {
    mockedFetchSales.mockReset()
  })

  it('renders dashboard content for a logged-in restaurant after sales load', async () => {
    mockedFetchSales.mockResolvedValue(sales)

    render(
      <RestaurantContext.Provider value={restaurantContextValue}>
        <Dashboard />
      </RestaurantContext.Provider>,
    )

    expect(screen.getByText('Welcome to Downtown')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Dashboard Summary')).toBeInTheDocument()
    })

    expect(mockedFetchSales).toHaveBeenCalledWith({ restaurantId: 1 })
    expect(screen.getByText('Sales Trend Chart')).toBeInTheDocument()
  })
})
