# Loading System Documentation

## Overview

A comprehensive loading system that provides consistent loading indicators across the application, including spinners, progress bars, skeleton loaders, and overlays.

## Components

### 1. LoadingSpinner

A versatile spinner component with multiple variants, sizes, and colors.

```tsx
import { LoadingSpinner } from '@/app/components/loading/LoadingSpinner';

<LoadingSpinner
  size="md"           // xs, sm, md, lg, xl
  variant="spinner"   // spinner, dots, pulse, bars, ring
  color="blue"        // blue, gray, white, green, red
  text="Loading..."   // Optional text
  className=""        // Additional CSS classes
/>
```

### 2. ProgressBar

Linear and circular progress indicators for file uploads and long operations.

```tsx
import { ProgressBar, CircularProgress } from '@/app/components/loading/ProgressBar';

// Linear progress bar
<ProgressBar
  progress={75}           // 0-100
  size="md"              // sm, md, lg
  variant="default"      // default, success, warning, error
  showPercentage={true}  // Show percentage text
  animated={true}        // Animate progress changes
/>

// Circular progress
<CircularProgress
  progress={60}
  size="lg"              // sm, md, lg, xl
  variant="success"
  showPercentage={true}
/>
```

### 3. SkeletonLoader

Skeleton components for different content types.

```tsx
import { 
  Skeleton, 
  TextSkeleton, 
  CardSkeleton, 
  TableSkeleton, 
  ListSkeleton, 
  FormSkeleton, 
  ImageSkeleton, 
  DashboardSkeleton 
} from '@/app/components/loading/SkeletonLoader';

// Basic skeleton
<Skeleton className="h-4 w-full" />

// Text skeleton with multiple lines
<TextSkeleton lines={3} />

// Card skeleton
<CardSkeleton />

// Table skeleton
<TableSkeleton rows={5} columns={4} />

// List skeleton
<ListSkeleton items={5} />

// Form skeleton
<FormSkeleton fields={4} />

// Image skeleton
<ImageSkeleton aspectRatio="square" />

// Dashboard skeleton
<DashboardSkeleton />
```

### 4. LoadingOverlay

Overlay components for different loading scenarios.

```tsx
import { 
  LoadingOverlay, 
  PageLoading, 
  InlineLoading, 
  ButtonLoading 
} from '@/app/components/loading/LoadingOverlay';

// Full-screen overlay
<LoadingOverlay
  isVisible={isLoading}
  text="Processing..."
  variant="spinner"
  size="lg"
  backdrop="blur"  // blur, dark, light, none
/>

// Page loading
<PageLoading text="Loading page..." />

// Inline loading
<InlineLoading text="Loading content..." />

// Button loading wrapper
<ButtonLoading isLoading={isLoading} loadingText="Processing...">
  <button>Click me</button>
</ButtonLoading>
```

## Hooks

### 1. useLoading

Local loading state management with delay and timeout options.

```tsx
import { useLoading } from '@/hooks/useLoading';

const {
  isLoading,
  message,
  progress,
  startLoading,
  stopLoading,
  updateProgress,
  updateMessage
} = useLoading({
  delay: 500,        // Delay before showing loading (ms)
  timeout: 10000,    // Timeout for loading (ms)
  onTimeout: () => console.log('Loading timed out')
});

// Start loading
startLoading('Processing...', 0);

// Update progress
updateProgress(50);

// Stop loading
stopLoading();
```

### 2. useApiLoading

Automatic loading management for API calls.

```tsx
import { useApiLoading } from '@/hooks/useLoading';

const { isLoading, executeWithLoading } = useApiLoading({
  delay: 500,
  timeout: 10000
});

const handleApiCall = async () => {
  const result = await executeWithLoading(
    async () => {
      const response = await fetch('/api/data');
      return response.json();
    },
    'Fetching data...'
  );
};
```

### 3. useUploadLoading

Loading management for file uploads with progress tracking.

```tsx
import { useUploadLoading } from '@/hooks/useLoading';

const { isLoading, progress, uploadWithProgress } = useUploadLoading();

const handleUpload = async (file: File) => {
  const result = await uploadWithProgress(
    async (onProgress) => {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress(i);
      }
      return { success: true };
    },
    'Uploading file...'
  );
};
```

### 4. useGlobalLoading

Global loading state management across the application.

```tsx
import { useGlobalLoading } from '@/app/contexts/LoadingContext';

const { 
  loadingState, 
  startLoading, 
  stopLoading, 
  updateProgress, 
  updateMessage 
} = useGlobalLoading();

// Start global loading
startLoading('Processing...', 'overlay');

// Update progress
updateProgress(75);

// Stop loading
stopLoading();
```

## API Client Integration

The loading system integrates with API clients to automatically show loading indicators for API calls.

```tsx
import { useLoadingApiClients } from '@/app/lib/loadingApiClient';

const { loadingAuthApiClient } = useLoadingApiClients();

// API calls automatically show loading indicators
const user = await loadingAuthApiClient.get('/user', {
  showLoading: true,
  loadingMessage: 'Fetching user data...'
});
```

## Best Practices

### 1. Loading Delays
- Use 500ms delay for API calls to avoid flickering
- Use 0ms delay for user-initiated actions (button clicks)
- Use longer delays for complex operations

### 2. Skeleton Loading
- Use skeleton loaders for content that takes >1 second to load
- Match skeleton structure to actual content
- Use appropriate skeleton types for different content

### 3. Progress Indicators
- Use progress bars for file uploads and long operations
- Update progress in real-time when possible
- Show percentage completion for better UX

### 4. Error Handling
- Always stop loading on errors
- Show appropriate error messages
- Provide retry options when possible

### 5. Mobile Optimization
- Ensure loading indicators are touch-friendly
- Use appropriate sizes for mobile screens
- Test on actual devices

## Testing

Visit `/loading-test` to test all loading components and features:

- Spinner variants and sizes
- Progress bars and circular progress
- Skeleton loaders for different content types
- Loading overlays and inline loading
- API loading simulation
- Upload progress simulation

## Accessibility

All loading components include proper ARIA attributes and are screen reader friendly:

- `aria-label` for screen readers
- `role="progressbar"` for progress indicators
- `aria-live="polite"` for loading messages
- Proper focus management during loading states
