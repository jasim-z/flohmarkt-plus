'use client';

import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { AddListingForm } from './forms/AddListingForm';

interface AddListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message?: string) => void;
  marketId: string;
  marketName: string;
  marketLocation: string;
}

export default function AddListingModalV2({ 
  isOpen, 
  onClose, 
  onSuccess, 
  marketId, 
  marketName, 
  marketLocation 
}: AddListingModalProps) {
  if (!isOpen) return null;

  const handleSuccess = (listing: any) => {
    onSuccess('Listing created successfully!');
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Listing</h2>
            <p className="text-sm text-gray-600 mt-1">
              {marketName} • {marketLocation}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <AddListingForm
            marketId={marketId}
            marketName={marketName}
            marketLocation={marketLocation}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
