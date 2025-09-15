# Error Boundary Implementation

## Overview
This implementation provides comprehensive error handling for the Flohmarkt Plus application using React Error Boundaries at multiple levels.

## Components

### 1. ErrorBoundary (Main Component)
- **Location**: `apps/frontend/src/app/components/ErrorBoundary.tsx`
- **Purpose**: Catches JavaScript errors anywhere in the child component tree
- **Features**:
  - Different UI for different error levels (global, page, component)
  - Retry functionality
  - Error logging to console
  - Development error details
  - Custom fallback UI support

### 2. Convenience Wrappers
- **GlobalErrorBoundary**: For app-wide error catching
- **PageErrorBoundary**: For page-level error catching
- **ComponentErrorBoundary**: For component-level error catching

## Implementation Levels

### 1. Global Level
- **Location**: `apps/frontend/src/app/layout.tsx`
- **Scope**: Catches all unhandled errors in the entire app
- **UI**: Full-screen error page with reload options

### 2. Page Level
- **Location**: All role-specific layouts
  - `apps/frontend/src/app/[locale]/(buyer)/layout.tsx`
  - `apps/frontend/src/app/[locale]/(seller)/layout.tsx`
  - `apps/frontend/src/app/[locale]/(admin)/layout.tsx`
- **Scope**: Catches errors within page content
- **UI**: Centered error card with retry and go-back options

### 3. Component Level
- **Location**: Critical components
  - `apps/frontend/src/app/components/Header.tsx`
  - `apps/frontend/src/app/components/Footer.tsx`
- **Scope**: Catches errors within specific components
- **UI**: Inline error message with retry button

## Error UI Variations

### Global Error
- Full-screen overlay
- Large error icon
- "Try Again" and "Reload Page" buttons
- Development error details (in dev mode)

### Page Error
- Centered card layout
- "Try Again" and "Go Back" buttons
- Clean, non-intrusive design

### Component Error
- Inline error message
- Small retry button
- Minimal space usage

## Features

### ✅ Implemented
- [x] Error boundary catches all unhandled React errors
- [x] Shows user-friendly error message instead of white screen
- [x] Includes "Try Again" button to retry the action
- [x] Logs error details to console for debugging
- [x] Maintains app state and doesn't crash the entire app
- [x] Different UI for different error levels
- [x] Development error details
- [x] Retry functionality
- [x] Error logging

### 🔄 Future Enhancements
- [ ] Error reporting service integration (Sentry, LogRocket, etc.)
- [ ] Error analytics and monitoring
- [ ] Custom error messages based on error type
- [ ] Error recovery strategies
- [ ] User feedback collection on errors

## Usage

### Basic Usage
```tsx
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### With Custom Fallback
```tsx
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

### With Error Handler
```tsx
<ErrorBoundary onError={(error, errorInfo) => {
  // Custom error handling
  console.log('Custom error handler:', error);
}}>
  <YourComponent />
</ErrorBoundary>
```

### Convenience Wrappers
```tsx
import { GlobalErrorBoundary, PageErrorBoundary, ComponentErrorBoundary } from '@/app/components/ErrorBoundary';

// Global level
<GlobalErrorBoundary>
  <App />
</GlobalErrorBoundary>

// Page level
<PageErrorBoundary>
  <PageContent />
</PageErrorBoundary>

// Component level
<ComponentErrorBoundary>
  <CriticalComponent />
</ComponentErrorBoundary>
```

## Testing

### Test Page
- **Location**: `apps/frontend/src/app/[locale]/(buyer)/error-test/page.tsx`
- **URL**: `/[locale]/error-test`
- **Features**: Interactive error testing component

### Test Component
- **Location**: `apps/frontend/src/app/components/ErrorTestComponent.tsx`
- **Purpose**: Demonstrates error boundary functionality
- **Features**: Button to trigger errors for testing

## Error Levels

### Global Level
- **When**: Unhandled errors in the entire app
- **UI**: Full-screen error page
- **Actions**: Try Again, Reload Page

### Page Level
- **When**: Errors in page content
- **UI**: Centered error card
- **Actions**: Try Again, Go Back

### Component Level
- **When**: Errors in specific components
- **UI**: Inline error message
- **Actions**: Try Again

## Development vs Production

### Development Mode
- Shows detailed error information
- Includes component stack trace
- Expandable error details section

### Production Mode
- Shows user-friendly error messages
- Hides technical details
- Focuses on recovery actions

## Error Logging

All errors are logged to the console with:
- Error message
- Error stack trace
- Component stack trace
- Error boundary level

## Future Error Reporting Service Integration

The ErrorBoundary is prepared for error reporting service integration:

```tsx
// In componentDidCatch method
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  // Current logging
  console.error('ErrorBoundary caught an error:', error, errorInfo);
  
  // Future: Send to error reporting service
  // this.reportError(error, errorInfo);
}
```

## Best Practices

1. **Use appropriate error boundary levels** for different components
2. **Test error boundaries** with intentional errors
3. **Provide meaningful error messages** to users
4. **Log errors** for debugging and monitoring
5. **Implement retry mechanisms** where appropriate
6. **Consider error reporting services** for production monitoring

## Troubleshooting

### Common Issues
1. **Error boundary not catching errors**: Ensure the error is thrown in a React component, not in event handlers or async code
2. **Error boundary not showing**: Check that the error boundary is properly wrapping the component
3. **Error boundary not resetting**: Ensure the retry mechanism is properly implemented

### Debug Tips
1. Check browser console for error logs
2. Verify error boundary placement in component tree
3. Test with intentional errors in development
4. Check error boundary level appropriateness
