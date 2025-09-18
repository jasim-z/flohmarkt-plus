'use client';

import { ErrorTestComponent } from '@/components';

export default function ErrorTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Error Boundary Testing</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold mb-4">Component Level Error</h2>
            <ErrorTestComponent />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">How to Test:</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-700">
                <li>Click the "Throw Error" button in the left panel</li>
                <li>Observe the error boundary catching the error</li>
                <li>Try the "Try Again" button to reset the component</li>
                <li>Check the browser console for error logs</li>
              </ol>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-green-800 mb-2">What's Implemented:</h3>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>Global error boundary in root layout</li>
                <li>Page-level error boundaries in all role layouts</li>
                <li>Component-level error boundaries in Header and Footer</li>
                <li>Different UI for different error levels</li>
                <li>Error logging to console</li>
                <li>Retry functionality</li>
                <li>Development error details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
