'use client';

import { useUser } from '@/contexts/UserContext';
import { useState, useEffect } from 'react';

export default function DebugLoadingPage() {
  const { role, isLoaded, isLoading, user } = useUser();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      role,
      isLoaded,
      isLoading,
      user: user ? { _id: user._id, email: user.email, role: user.role } : null,
      authToken: localStorage.getItem('auth_token') ? 'Present' : 'Not found',
      timestamp: new Date().toISOString()
    };
    setDebugInfo(info);
  }, [role, isLoaded, isLoading, user]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Debug Loading Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Context Status</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p><strong>Role:</strong> {role || 'Not set'}</p>
              <p><strong>Is Loaded:</strong> {isLoaded ? 'Yes' : 'No'}</p>
              <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p><strong>User ID:</strong> {user?._id || 'Not set'}</p>
              <p><strong>User Email:</strong> {user?.email || 'Not set'}</p>
              <p><strong>Auth Token:</strong> {debugInfo.authToken}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
          <ul className="list-disc list-inside space-y-2 text-blue-700">
            <li>If "Is Loading" is stuck on "Yes", check if backend services are running</li>
            <li>If "Auth Token" is "Not found", you need to log in first</li>
            <li>If "Is Loaded" is "No", there might be an API error</li>
            <li>Check browser console for error messages</li>
            <li>Check Network tab for failed API requests</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
