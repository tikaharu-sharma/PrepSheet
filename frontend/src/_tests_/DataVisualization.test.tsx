import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import DataVisualization from '../pages/DataVisualization'
import * as api from '../lib/api'
import type { SaleRecord } from "../lib/api"
import { within } from '@testing-library/react'

// Mock API
vi.mock('../lib/api', () => ({
  fetchSales: vi.fn(),
}))

// Mock context
vi.mock('../context/useRestaurant', () => ({
  useRestaurant: () => ({
    restaurants: [
      { id: 1, name: 'Indian Restaurant Mina - Asakawa'},
      { id: 2, name: 'Indian Restaurant Mina - Tobata' },
    ],
  }),
}))

const mockSales: Partial<SaleRecord>[] = [
  {
    restaurant_id: 1,
    restaurant_name: 'Indian Restaurant Mina - Asakawa',
    date: "2026-04-01",
    lunch_sale: 100,
    dinner_sale: 200,
    lunch_head_count: 10,
    dinner_head_count: 20,
    expenditures: [{title: "Coffee", amount: 50 }],
  },
]

describe('DataVisualization page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    vi.mocked(api.fetchSales).mockReturnValue(new Promise(() => {}))

    render(<DataVisualization />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders data correctly after fetch', async () => {
    vi.mocked(api.fetchSales).mockResolvedValue(mockSales as any)

    render(<DataVisualization />)

    expect(
        await screen.findByRole('heading', {
        level: 1,
        name: /restaurant comparison/i,
        })
    ).toBeInTheDocument()

    const row = screen.getByText('Indian Restaurant Mina - Asakawa').closest('tr') as HTMLTableRowElement
    expect(row).toBeInTheDocument()

    const cells = within(row).getAllByRole('cell')

    expect(cells[1]).toHaveTextContent('￥300')
    expect(cells[2]).toHaveTextContent('30')
    expect(cells[3]).toHaveTextContent('30.0')
})

it('shows empty state when no data', async () => {
    vi.mocked(api.fetchSales).mockResolvedValue([])

    render(<DataVisualization />)

    expect(
      await screen.findByText(/no sales data is available/i)
    ).toBeInTheDocument()
  })

  it('shows error state when API fails', async () => {
    vi.mocked(api.fetchSales).mockRejectedValue(new Error('Failed to load'))

    render(<DataVisualization />)

    expect(
      await screen.findByText(/failed to load/i)
    ).toBeInTheDocument()
  })
})
