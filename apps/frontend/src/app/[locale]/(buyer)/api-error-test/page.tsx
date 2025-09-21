'use client';

import { ApiErrorTestComponent } from '@/components';

export default function ApiErrorTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">API Error Handling Test</h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">What's Implemented</h2>
          <div className="grid md:grid-cols-2 gap-4 text-blue-700">
            <div>
              <h3 className="font-semibold mb-2">Error Types:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Network errors → "Connection failed, please try again"</li>
                <li>401 errors → Redirect to login page</li>
                <li>403 errors → "You don't have permission" message</li>
                <li>404 errors → "Resource not found" message</li>
                <li>500 errors → "Server error, please try later" message</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Automatic retry for transient errors</li>
                <li>Toast notifications with retry buttons</li>
                <li>Error logging to console</li>
                <li>Request timeout handling</li>
                <li>Exponential backoff retry strategy</li>
              </ul>
            </div>
          </div>
        </div>

        <ApiErrorTestComponent />
      </div>
    </div>
  );
}
