'use client';

import { useState } from 'react';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import { ProgressBar, CircularProgress } from '@/components/loading/ProgressBar';
import { 
  Skeleton, 
  TextSkeleton, 
  CardSkeleton, 
  TableSkeleton, 
  ListSkeleton, 
  FormSkeleton, 
  ImageSkeleton, 
  DashboardSkeleton 
} from '@/components/loading/SkeletonLoader';
import { 
  LoadingOverlay, 
  PageLoading, 
  InlineLoading, 
  ButtonLoading 
} from '@/components/loading/LoadingOverlay';
import { useLoading, useApiLoading, useUploadLoading } from '@/app/hooks/useLoading';
import { useGlobalLoading } from '@/app/contexts/LoadingContext';

export default function LoadingTestPage() {
  const [activeSection, setActiveSection] = useState<'spinners' | 'progress' | 'skeletons' | 'overlays' | 'api' | 'upload'>('spinners');
  const [showOverlay, setShowOverlay] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Local loading hooks
  const localLoading = useLoading({ delay: 500 });
  const apiLoading = useApiLoading({ delay: 500 });
  const uploadLoading = useUploadLoading({ delay: 0 });
  
  // Global loading context
  const globalLoading = useGlobalLoading();

  const simulateApiCall = async () => {
    await apiLoading.executeWithLoading(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { success: true };
      },
      'Fetching data...'
    );
  };

  const simulateUpload = async () => {
    await uploadLoading.uploadWithProgress(
      async (onProgress) => {
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          onProgress(i);
        }
        return { success: true };
      },
      'Uploading file...'
    );
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const sections = [
    { id: 'spinners', label: 'Spinners' },
    { id: 'progress', label: 'Progress Bars' },
    { id: 'skeletons', label: 'Skeleton Loaders' },
    { id: 'overlays', label: 'Loading Overlays' },
    { id: 'api', label: 'API Loading' },
    { id: 'upload', label: 'Upload Progress' }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Loading Components Test
          </h1>

          {/* Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Spinners Section */}
          {activeSection === 'spinners' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Loading Spinners</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Size variants */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Sizes</h3>
                  <div className="space-y-3">
                    <LoadingSpinner size="xs" text="Extra Small" />
                    <LoadingSpinner size="sm" text="Small" />
                    <LoadingSpinner size="md" text="Medium" />
                    <LoadingSpinner size="lg" text="Large" />
                    <LoadingSpinner size="xl" text="Extra Large" />
                  </div>
                </div>

                {/* Variant types */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Variants</h3>
                  <div className="space-y-3">
                    <LoadingSpinner variant="spinner" text="Spinner" />
                    <LoadingSpinner variant="dots" text="Dots" />
                    <LoadingSpinner variant="pulse" text="Pulse" />
                    <LoadingSpinner variant="bars" text="Bars" />
                    <LoadingSpinner variant="ring" text="Ring" />
                  </div>
                </div>

                {/* Colors */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Colors</h3>
                  <div className="space-y-3">
                    <LoadingSpinner color="blue" text="Blue" />
                    <LoadingSpinner color="gray" text="Gray" />
                    <LoadingSpinner color="green" text="Green" />
                    <LoadingSpinner color="red" text="Red" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bars Section */}
          {activeSection === 'progress' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Progress Bars</h2>
              
              <div className="space-y-6">
                {/* Linear Progress Bars */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Linear Progress Bars</h3>
                  <div className="space-y-4">
                    <ProgressBar progress={progress} size="sm" />
                    <ProgressBar progress={progress} size="md" />
                    <ProgressBar progress={progress} size="lg" />
                    <ProgressBar progress={progress} variant="success" />
                    <ProgressBar progress={progress} variant="warning" />
                    <ProgressBar progress={progress} variant="error" />
                  </div>
                  <button
                    onClick={simulateProgress}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Simulate Progress
                  </button>
                </div>

                {/* Circular Progress */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Circular Progress</h3>
                  <div className="flex space-x-6">
                    <CircularProgress progress={progress} size="sm" />
                    <CircularProgress progress={progress} size="md" />
                    <CircularProgress progress={progress} size="lg" />
                    <CircularProgress progress={progress} size="xl" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skeleton Loaders Section */}
          {activeSection === 'skeletons' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Skeleton Loaders</h2>
              
              <div className="space-y-6">
                {/* Text Skeleton */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Text Skeleton</h3>
                  <TextSkeleton lines={3} />
                </div>

                {/* Card Skeleton */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Card Skeleton</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                </div>

                {/* Table Skeleton */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Table Skeleton</h3>
                  <TableSkeleton rows={5} columns={4} />
                </div>

                {/* List Skeleton */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">List Skeleton</h3>
                  <ListSkeleton items={4} />
                </div>

                {/* Form Skeleton */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Form Skeleton</h3>
                  <FormSkeleton fields={4} />
                </div>

                {/* Image Skeleton */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Image Skeleton</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ImageSkeleton aspectRatio="square" />
                    <ImageSkeleton aspectRatio="video" />
                    <ImageSkeleton aspectRatio="wide" />
                    <ImageSkeleton aspectRatio="tall" />
                  </div>
                </div>

                {/* Dashboard Skeleton */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Dashboard Skeleton</h3>
                  <DashboardSkeleton />
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlays Section */}
          {activeSection === 'overlays' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Loading Overlays</h2>
              
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setShowOverlay(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Show Overlay
                  </button>
                  
                  <button
                    onClick={() => localLoading.startLoading('Processing...')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Start Local Loading
                  </button>
                  
                  <button
                    onClick={() => globalLoading.startLoading('Global loading...', 'overlay')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Start Global Loading
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Inline Loading</h3>
                  <InlineLoading text="Loading content..." />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Button Loading</h3>
                  <ButtonLoading isLoading={localLoading.isLoading} loadingText="Processing...">
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-lg">
                      Click me
                    </button>
                  </ButtonLoading>
                </div>
              </div>
            </div>
          )}

          {/* API Loading Section */}
          {activeSection === 'api' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">API Loading</h2>
              
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={simulateApiCall}
                    disabled={apiLoading.isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {apiLoading.isLoading ? 'Loading...' : 'Simulate API Call'}
                  </button>
                </div>

                {apiLoading.isLoading && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-800">API call in progress...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Progress Section */}
          {activeSection === 'upload' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Progress</h2>
              
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={simulateUpload}
                    disabled={uploadLoading.isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {uploadLoading.isLoading ? 'Uploading...' : 'Simulate File Upload'}
                  </button>
                </div>

                {uploadLoading.isLoading && (
                  <div className="space-y-4">
                    <p className="text-gray-700">{uploadLoading.message}</p>
                    <ProgressBar 
                      progress={uploadLoading.progress || 0} 
                      variant="success"
                      showPercentage={true}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={showOverlay}
        text="Processing request..."
        variant="spinner"
        size="lg"
        backdrop="blur"
      />

      {/* Global Loading Overlay */}
      {globalLoading.loadingState.isLoading && globalLoading.loadingState.type === 'overlay' && (
        <LoadingOverlay
          isVisible={true}
          text={globalLoading.loadingState.message}
          variant="spinner"
          size="lg"
          backdrop="blur"
        />
      )}
    </div>
  );
}
