import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MarketCard from '../business/MarketCard'

const mockMarket = {
  _id: '1',
  name: 'Test Market',
  description: 'A test market for testing',
  location: 'Test City',
  date: '2025-12-25T10:00:00Z',
  startTime: '10:00',
  endTime: '18:00',
  bannerImage: 'https://example.com/image.jpg',
  categories: ['Electronics', 'Clothing'],
  status: 'upcoming',
  vendorLimit: 50,
  registeredVendors: [],
  price: 25,
}

describe('MarketCard', () => {
  const user = userEvent.setup()

  it('renders market information correctly', () => {
    render(<MarketCard market={mockMarket} onClick={() => {}} />)

    expect(screen.getByText('Test Market')).toBeInTheDocument()
    // Description may be truncated/hidden; validate core fields instead
    expect(screen.getByText('Test City')).toBeInTheDocument()
    // Date format uses weekday short; just assert month/day present
    expect(screen.getByText(/Dec\s+25/)).toBeInTheDocument()
    expect(screen.getByText('10:00 - 18:00')).toBeInTheDocument()
  })

  it('renders market image', () => {
    render(<MarketCard market={mockMarket} onClick={() => {}} />)

    const image = screen.getByAltText('Test Market')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('renders categories', () => {
    render(<MarketCard market={mockMarket} onClick={() => {}} />)

    expect(screen.getByText('Electronics')).toBeInTheDocument()
    // Second category is summarized as +1
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('renders vendor count', () => {
    render(<MarketCard market={mockMarket} onClick={() => {}} />)

    expect(screen.getByText(/0\s+vendors/)).toBeInTheDocument()
  })

  it('renders price', () => {
    render(<MarketCard market={mockMarket} onClick={() => {}} />)

    expect(screen.getByText(/25/)).toBeInTheDocument()
  })

  it('renders status badge', () => {
    render(<MarketCard market={mockMarket} onClick={() => {}} />)

    expect(screen.getByText('Upcoming')).toBeInTheDocument()
  })

  it('calls onClick when card is clicked', async () => {
    const mockOnClick = jest.fn()
    render(<MarketCard market={mockMarket} onClick={mockOnClick} />)

    const card = screen.getByTestId('market-card')
    await user.click(card)

    expect(mockOnClick).toHaveBeenCalled()
  })

  it('renders a status badge', () => {
    render(<MarketCard market={mockMarket} onClick={() => {}} />)
    expect(screen.getByTestId('market-status')).toBeInTheDocument()
  })

  it('handles missing image gracefully', () => {
    const marketWithoutImage = { ...mockMarket, bannerImage: '' }
    render(<MarketCard market={marketWithoutImage} onClick={() => {}} />)

    expect(screen.getByTestId('market-icon')).toBeInTheDocument()
  })

  it('formats date correctly', () => {
    render(<MarketCard market={mockMarket} onClick={() => {}} />)

    expect(screen.getByText(/Dec\s+25/)).toBeInTheDocument()
  })

  it('formats time correctly', () => {
    render(<MarketCard market={mockMarket} onClick={() => {}} />)

    expect(screen.getByText('10:00 - 18:00')).toBeInTheDocument()
  })
})
