'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/forms/LoginForm';
import { SignupForm } from '@/components/forms/SignupForm';
import { AddListingForm } from '@/components/forms/AddListingForm';

export default function FormValidationTest() {
  const [activeForm, setActiveForm] = useState<'login' | 'signup' | 'listing'>('login');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Form Validation Test
          </h1>

          {/* Form Selector */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveForm('login')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeForm === 'login'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Login Form
              </button>
              <button
                onClick={() => setActiveForm('signup')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeForm === 'signup'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Signup Form
              </button>
              <button
                onClick={() => setActiveForm('listing')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeForm === 'listing'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Listing Form
              </button>
            </div>
          </div>

          {/* Form Display */}
          <div className="max-w-2xl mx-auto">
            {activeForm === 'login' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Login Form</h2>
                <LoginForm />
              </div>
            )}

            {activeForm === 'signup' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Signup Form</h2>
                <SignupForm />
              </div>
            )}

            {activeForm === 'listing' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Listing Form</h2>
                <AddListingForm
                  marketId="test-market-id"
                  marketName="Test Market"
                  marketLocation="Munich, Germany"
                  onSuccess={(listing) => {
                    console.log('Listing created:', listing);
                    alert('Listing created successfully!');
                  }}
                  onCancel={() => {
                    console.log('Form cancelled');
                  }}
                />
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Testing Instructions</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• <strong>Real-time validation:</strong> Try typing in fields and see errors appear/disappear</li>
              <li>• <strong>Blur validation:</strong> Click on a field and then click away to see validation</li>
              <li>• <strong>Required fields:</strong> Try submitting with empty required fields</li>
              <li>• <strong>Email validation:</strong> Try invalid email formats</li>
              <li>• <strong>Password matching:</strong> In signup, try different passwords</li>
              <li>• <strong>Price validation:</strong> In listing form, try negative prices or free items</li>
              <li>• <strong>Mobile responsive:</strong> Test on mobile devices or browser dev tools</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
