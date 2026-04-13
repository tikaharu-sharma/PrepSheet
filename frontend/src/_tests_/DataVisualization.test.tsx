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
      { id: 1, name: 'Restaurant A' },
      { id: 2, name: 'Restaurant B' },
    ],
  }),
}))

const mockSales: Partial<SaleRecord>[] = [
  {
    restaurant_id: 1,
    restaurant_name: "Testaurant",
    date: "2026-04-01",
    lunch_sale: 100,
    dinner_sale: 200,
    lunch_head_count: 10,
    dinner_head_count: 20,
    expenditures: [{title: "Coffee", amount: 50 }],
  },
]

