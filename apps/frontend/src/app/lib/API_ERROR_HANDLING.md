# API Error Handling System

## Overview
This implementation provides comprehensive API error handling for the Flohmarkt Plus application with centralized error management, retry logic, and user-friendly error notifications.

## Components

### 1. ApiErrorHandler
- **Location**: `apps/frontend/src/app/lib/apiErrorHandler.ts`
- **Purpose**: Centralized error handling and classification
- **Features**:
  - Error type classification (network, auth, permission, not_found, server, validation, unknown)
  - User-friendly error messages
  - Retry logic for transient errors
  - Automatic auth/permission error handling

### 2. ApiClient
- **Location**: `apps/frontend/src/app/lib/apiClient.ts`
- **Purpose**: Centralized HTTP client with retry logic
- **Features**:
  - Automatic retry for transient errors
  - Request timeout handling
  - Exponential backoff retry strategy
  - Service-specific client instances

### 3. ApiErrorNotification
- **Location**: `apps/frontend/src/app/components/ApiErrorNotification.tsx`
- **Purpose**: User-friendly error notifications
- **Features**:
  - Toast notifications with retry buttons
  - Different UI for different error types
  - Dismissible error messages
  - React hook for easy integration

## Error Types and Messages

### Network Errors
- **Trigger**: Connection failures, timeouts, network issues
- **Message**: "Connection failed, please try again"
- **Retryable**: Yes
- **User Action**: Retry button available

### Authentication Errors (401)
- **Trigger**: Invalid or expired tokens
- **Message**: "Please log in to continue"
- **Retryable**: No
- **User Action**: Automatic redirect to login page

### Permission Errors (403)
- **Trigger**: Insufficient permissions
- **Message**: "You don't have permission to perform this action"
- **Retryable**: No
- **User Action**: Automatic redirect to unauthorized page

### Not Found Errors (404)
- **Trigger**: Resource not found
- **Message**: "Resource not found"
- **Retryable**: No
- **User Action**: Dismiss button

### Server Errors (5xx)
- **Trigger**: Server-side errors
- **Message**: "Server error, please try later"
- **Retryable**: Yes (for 500, 502, 503, 504)
- **User Action**: Retry button available

### Validation Errors (422)
- **Trigger**: Invalid input data
- **Message**: "Please check your input and try again"
- **Retryable**: No
- **User Action**: Dismiss button

## Retry Logic

### Retryable Status Codes
- 408 (Request Timeout)
- 429 (Too Many Requests)
- 500 (Internal Server Error)
- 502 (Bad Gateway)
- 503 (Service Unavailable)
- 504 (Gateway Timeout)

### Retry Strategy
- **Max Attempts**: 3 retries
- **Delays**: 1s, 2s, 4s (exponential backoff)
- **Timeout**: 30 seconds per request
- **Rate Limiting**: 60 seconds delay for 429 errors

## Usage Examples

### Basic API Call with Error Handling
```typescript
import { marketsApiClient } from '@/app/lib/apiClient';
import { apiErrorHandler } from '@/app/lib/apiErrorHandler';

try {
  const response = await marketsApiClient.get('/markets');
  console.log(response.data);
} catch (error) {
  const apiError = apiErrorHandler.handleError(error);
  console.error('API Error:', apiError.message);
  // Error will be automatically handled (redirects, notifications, etc.)
}
```

### Using Error Notifications
```typescript
import { useApiErrorNotification } from '@/app/components/ApiErrorNotification';

function MyComponent() {
  const { error, showError, clearError, handleRetry } = useApiErrorNotification();

  const handleApiCall = async () => {
    try {
      await someApiCall();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <div>
      <button onClick={handleApiCall}>Make API Call</button>
      <ApiErrorNotification
        error={error}
        onRetry={() => handleRetry(handleApiCall)}
        onDismiss={clearError}
      />
    </div>
  );
}
```

### Service-Specific API Clients
```typescript
import { 
  authApiClient, 
  marketsApiClient, 
  messagesApiClient,
  listingsApiClient,
  ordersApiClient,
  usersApiClient
} from '@/app/lib/apiClient';

// Auth API calls
const user = await authApiClient.get('/auth/me');

// Markets API calls
const markets = await marketsApiClient.get('/markets');

// Messages API calls
const conversations = await messagesApiClient.get('/conversations');
```

## API Integration Status

### ✅ Updated APIs
- **Auth API** (`apps/frontend/src/app/api/auth.ts`)
  - `loginUser()` - with error handling
  - `signupUser()` - with error handling
  - `getCurrentUser()` - with auth error handling
  - `logoutUser()` - with error handling

- **Messages API** (`apps/frontend/src/app/api/messages.ts`)
  - `getOrCreateConversation()` - with error handling
  - `listConversations()` - with error handling
  - `listMessages()` - with error handling
  - `sendMessage()` - with error handling
  - `markRead()` - with error handling
  - `getUnreadTotal()` - with error handling

### 🔄 Pending APIs
- **Markets API** (`apps/frontend/src/app/api/markets.ts`)
- **Listings API** (`apps/frontend/src/app/api/listings.ts`)
- **Users API** (`apps/frontend/src/app/api/users.ts`)

## Testing

### Test Page
- **Location**: `apps/frontend/src/app/[locale]/(buyer)/api-error-test/page.tsx`
- **URL**: `/[locale]/api-error-test`
- **Features**: Interactive API error testing

### Test Component
- **Location**: `apps/frontend/src/app/components/ApiErrorTestComponent.tsx`
- **Purpose**: Demonstrates API error handling functionality
- **Features**: 
  - Network error simulation
  - 401/403/404/500 error testing
  - Timeout error testing
  - Retry functionality testing

## Configuration

### Environment Variables
```bash
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3950
NEXT_PUBLIC_API_URL=http://localhost:3953
NEXT_PUBLIC_MESSAGES_API_URL=http://localhost:3954
NEXT_PUBLIC_LISTINGS_API_URL=http://localhost:3951
NEXT_PUBLIC_ORDERS_API_URL=http://localhost:3955
NEXT_PUBLIC_USERS_API_URL=http://localhost:3950
```

### Custom Error Messages
Error messages can be customized in `apiErrorHandler.ts`:
```typescript
const ERROR_MESSAGES = {
  network: 'Custom network error message',
  auth: 'Custom auth error message',
  // ... other error types
};
```

## Error Flow

1. **API Call Made** → ApiClient
2. **Error Occurs** → ApiErrorHandler.handleError()
3. **Error Classified** → Error type determined
4. **Retry Check** → Should retry based on error type
5. **User Notification** → ApiErrorNotification displays error
6. **User Action** → Retry, dismiss, or automatic redirect

## Best Practices

1. **Always use try-catch** around API calls
2. **Let ApiErrorHandler handle errors** - don't manually handle common cases
3. **Use service-specific clients** for better organization
4. **Test error scenarios** in development
5. **Monitor error logs** in production
6. **Provide meaningful error messages** to users

## Future Enhancements

- [ ] Error reporting service integration (Sentry, LogRocket)
- [ ] Error analytics and monitoring
- [ ] Custom error recovery strategies
- [ ] Offline error handling
- [ ] Error rate limiting
- [ ] A/B testing for error messages

## Troubleshooting

### Common Issues
1. **Errors not showing**: Check if ApiErrorNotification is properly integrated
2. **Retry not working**: Verify error is retryable and retry attempts not exceeded
3. **Auth redirects not working**: Check if auth error handling is properly configured
4. **Toast notifications not showing**: Ensure react-hot-toast is properly set up

### Debug Tips
1. Check browser console for error logs
2. Verify API client configuration
3. Test with different error scenarios
4. Check network tab for actual HTTP responses
5. Verify error handler integration in API calls
