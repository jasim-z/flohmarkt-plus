'use client';

import { useState } from 'react';
import { ComponentErrorBoundary } from './ErrorBoundary';

// Component that can throw errors for testing
function BuggyComponent() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('This is a test error for the ErrorBoundary!');
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Error Test Component</h3>
      <p className="text-gray-600 mb-4">
        This component can throw an error to test the ErrorBoundary.
      </p>
      <button
        onClick={() => setShouldThrow(true)}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
      >
        Throw Error
      </button>
    </div>
  );
}

export default function ErrorTestComponent() {
  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Error Boundary Test</h2>
      <ComponentErrorBoundary>
        <BuggyComponent />
      </ComponentErrorBoundary>
    </div>
  );
}
