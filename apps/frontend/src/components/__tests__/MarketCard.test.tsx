import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarketCard } from '../business/MarketCard'

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
    expect(screen.getByText('A test market for testing')).toBeInTheDocument()
    expect(screen.getByText('Test City')).toBeInTheDocument()
    expect(screen.getByText('Dec 25, 2025')).toBeInTheDocument()
    expect(screen.getByText('10:00 AM - 6:00 PM')).toBeInTheDocument()
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
    expect(screen.getByText('Clothing')).toBeInTheDocument()
  })

  it('renders vendor count', () => {
    render(<MarketCard market={mockMarket} onClick={() => {}} />)

    expect(screen.getByText('0 / 50 vendors')).toBeInTheDocument()
  })

  it('renders price', () => {
    render(<MarketCard market={mockMarket} onClick={() => {}} />)

    expect(screen.getByText('$25')).toBeInTheDocument()
  })

  it('renders status badge', () => {
    render(<MarketCard market={mockMarket} onClick={() => {}} />)

    expect(screen.getByText('Upcoming')).toBeInTheDocument()
  })

  it('calls onClick when card is clicked', async () => {
    const mockOnClick = jest.fn()
    render(<MarketCard market={mockMarket} onClick={mockOnClick} />)

    const card = screen.getByRole('button')
    await user.click(card)

    expect(mockOnClick).toHaveBeenCalledWith(mockMarket)
  })

  it('renders different status badges correctly', () => {
    const liveMarket = { ...mockMarket, status: 'live' }
    const endedMarket = { ...mockMarket, status: 'ended' }

    const { rerender } = render(<MarketCard market={liveMarket} onClick={() => {}} />)
    expect(screen.getByText('Live Now')).toBeInTheDocument()

    rerender(<MarketCard market={endedMarket} onClick={() => {}} />)
    expect(screen.getByText('Ended')).toBeInTheDocument()
  })

  it('handles missing image gracefully', () => {
    const marketWithoutImage = { ...mockMarket, bannerImage: '' }
    render(<MarketCard market={marketWithoutImage} onClick={() => {}} />)

    const image = screen.getByAltText('Test Market')
    expect(image).toBeInTheDocument()
  })

  it('formats date correctly', () => {
    render(<MarketCard market={mockMarket} onClick={() => {}} />)

    expect(screen.getByText('Dec 25, 2025')).toBeInTheDocument()
  })

  it('formats time correctly', () => {
    render(<MarketCard market={mockMarket} onClick={() => {}} />)

    expect(screen.getByText('10:00 AM - 6:00 PM')).toBeInTheDocument()
  })
})
