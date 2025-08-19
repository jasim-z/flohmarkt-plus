# Markets Landing Page

A modern, responsive markets landing page inspired by food delivery apps like Lieferando, built with Next.js and Tailwind CSS.

## Features

### 🎨 **Modern Design**
- Beautiful gradient hero section with search functionality
- Clean, minimal market cards with hover effects
- Responsive design optimized for all devices
- Consistent with the app's design system

### 🔍 **Advanced Search & Filtering**
- **Search Bar**: Full-text search across market names, descriptions, and locations
- **Search Suggestions**: Popular search terms for quick access
- **Category Filters**: Horizontal scrolling category navigation
- **Status Filters**: Filter by upcoming, live, or past markets
- **Sorting Options**: Sort by date, name, vendor count, or start time
- **Clear Filters**: Easy way to reset all applied filters

### 📱 **Mobile-First Responsiveness**
- Collapsible mobile filters panel
- Optimized touch targets and spacing
- Responsive grid layouts (1-4 columns based on screen size)
- Sticky category navigation

### 🃏 **Market Cards**
- **Featured Cards**: Large cards for top 3 markets with detailed information
- **Compact Cards**: Smaller cards for the main grid with essential details
- **Status Badges**: Visual indicators for market status (Upcoming, Live Now, Ended)
- **Hover Effects**: Smooth animations and transitions
- **Minimal Information Display**:
  - Market image/banner
  - Market name
  - Date and time
  - Location
  - Vendor count
  - Categories

### ⚡ **Performance Features**
- Lazy loading with skeleton screens
- Optimized re-renders with useMemo
- Efficient filtering and sorting
- Smooth animations and transitions

## Components

### MarketCard Component
- **Location**: `src/components/MarketCard.tsx`
- **Variants**: `featured` (large) and `compact` (small)
- **Props**: `market`, `variant`, `onClick`
- **Features**: Responsive design, status badges, hover effects

### Main Page
- **Location**: `src/app/[locale]/(buyer)/user-markets/page.tsx`
- **Features**: Search, filtering, sorting, responsive layout

## Styling

### CSS Classes
- **Custom Animations**: `market-card`, `category-btn`, `status-badge`
- **Responsive Utilities**: `scrollbar-hide`, `skeleton`
- **Tailwind Extensions**: Custom primary color palette

### Design System
- **Colors**: Primary blue theme with gray accents
- **Typography**: Responsive font sizes and weights
- **Spacing**: Consistent spacing scale
- **Shadows**: Subtle shadows with hover effects

## API Integration

### Market Data
- Fetches markets from the backend API
- Supports search, filtering, and sorting parameters
- Handles loading states and errors gracefully

### Search Parameters
```typescript
interface GetMarketsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

## Usage

### Basic Implementation
```tsx
import MarketCard from '@/components/MarketCard';

<MarketCard
  market={marketData}
  variant="featured"
  onClick={() => handleMarketClick(market.id)}
/>
```

### Filtering Markets
```tsx
const filteredMarkets = useMemo(() => {
  let filtered = [...markets];
  
  if (filters.search) {
    filtered = filtered.filter(market =>
      market.name.toLowerCase().includes(filters.search.toLowerCase())
    );
  }
  
  if (filters.category !== 'All Markets') {
    filtered = filtered.filter(market =>
      market.categories.some(cat => 
        cat.toLowerCase().includes(filters.category.toLowerCase())
      )
    );
  }
  
  return filtered;
}, [markets, filters]);
```

## Responsive Breakpoints

- **Mobile**: 1 column grid, collapsible filters
- **Small**: 2 column grid
- **Medium**: 3 column grid
- **Large**: 4 column grid, inline filters

## Future Enhancements

- [ ] Real-time market updates
- [ ] Advanced filtering (price range, distance)
- [ ] Market favorites/bookmarks
- [ ] Push notifications for new markets
- [ ] Market reviews and ratings
- [ ] Integration with maps for location-based search

## Browser Support

- Modern browsers with ES6+ support
- CSS Grid and Flexbox support required
- Tailwind CSS v3+ required 