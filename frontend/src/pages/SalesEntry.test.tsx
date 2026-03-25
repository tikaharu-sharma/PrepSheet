import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SalesEntry from './SalesEntry'
import { submitSale } from '../lib/api'
import { RestaurantContext } from '../context/RestaurantContext'
import type { RestaurantContextType } from '../context/RestaurantContext'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>()
  return {
    ...actual,
    submitSale: vi.fn(),
  }
})

const mockedSubmitSale = vi.mocked(submitSale)

const restaurants = [
  { id: 1, name: 'Indian Restaurant Mina - Asakawa' },
  { id: 2, name: 'Indian Restaurant Mina - Tobata' },
]

function renderSalesEntry() {
  const value: RestaurantContextType = {
    restaurants,
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
      <SalesEntry />
    </RestaurantContext.Provider>,
  )
}

async function goToSalesDetails(user: ReturnType<typeof userEvent.setup>) {
  const restaurantSelect = screen.getByRole('combobox', { name: /select restaurant/i })
  await user.click(restaurantSelect)
  await user.click(await screen.findByRole('option', { name: /asakawa/i }))
  await user.click(screen.getByRole('button', { name: /next/i }))
}

describe('SalesEntry page', () => {
  beforeEach(() => {
    mockedSubmitSale.mockReset()
  })

  it('shows validation errors for missing required sales fields', async () => {
    const user = userEvent.setup()
    renderSalesEntry()

    await goToSalesDetails(user)
    await user.click(screen.getByRole('button', { name: /^submit$/i }))

    expect(await screen.findByText('Lunch persons is required.')).toBeInTheDocument()
    expect(mockedSubmitSale).not.toHaveBeenCalled()
  })

  it('adds and removes an expenditure row', async () => {
    const user = userEvent.setup()
    renderSalesEntry()

    await goToSalesDetails(user)
    await user.click(screen.getByRole('button', { name: /add expenditure/i }))

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Amount')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '' }))

    await waitFor(() => {
      expect(screen.queryByLabelText('Title')).not.toBeInTheDocument()
    })
  })

  it('submits a valid sales entry and shows a success message', async () => {
    const user = userEvent.setup()
    mockedSubmitSale.mockResolvedValue({ message: 'ok', sale_id: 1 })
    renderSalesEntry()

    await goToSalesDetails(user)

    await user.type(screen.getByLabelText(/no\. of persons \(lunch\)/i), '25')
    await user.type(screen.getByLabelText(/lunch sale/i), '25000')
    await user.type(screen.getByLabelText(/no\. of persons \(dinner\)/i), '20')
    await user.type(screen.getByLabelText(/dinner sale/i), '30000')
    await user.type(screen.getByLabelText(/credit sale/i), '15000')
    await user.type(screen.getByLabelText(/reji money/i), '40000')
    await user.click(screen.getByRole('button', { name: /add expenditure/i }))
    await user.type(screen.getByLabelText('Title'), 'Vegetables')
    await user.type(screen.getByLabelText('Amount'), '5000')
    await user.type(screen.getByLabelText(/notes \(optional\)/i), 'Busy lunch service')
    await user.click(screen.getByRole('button', { name: /^submit$/i }))

    await waitFor(() => {
      expect(mockedSubmitSale).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurant_id: 1,
          restaurant: 'Indian Restaurant Mina - Asakawa',
          lunch_head_count: 25,
          lunch_sale: 25000,
          dinner_head_count: 20,
          dinner_sale: 30000,
          credit_sale: 15000,
          reji_money: 40000,
          expenditures: [{ title: 'Vegetables', amount: 5000 }],
          note: 'Busy lunch service',
        }),
      )
    })

    expect(await screen.findByText('Sales entry logged successfully.')).toBeInTheDocument()
  })

  it('shows backend submit errors such as duplicate-day conflicts', async () => {
    const user = userEvent.setup()
    mockedSubmitSale.mockRejectedValue({ message: 'A sale already exists for this restaurant on that date.' })
    renderSalesEntry()

    await goToSalesDetails(user)
    await user.type(screen.getByLabelText(/no\. of persons \(lunch\)/i), '25')
    await user.type(screen.getByLabelText(/lunch sale/i), '25000')
    await user.type(screen.getByLabelText(/no\. of persons \(dinner\)/i), '20')
    await user.type(screen.getByLabelText(/dinner sale/i), '30000')
    await user.type(screen.getByLabelText(/credit sale/i), '15000')
    await user.type(screen.getByLabelText(/reji money/i), '40000')
    await user.click(screen.getByRole('button', { name: /^submit$/i }))

    expect(await screen.findByText('A sale already exists for this restaurant on that date.')).toBeInTheDocument()
  })
})
