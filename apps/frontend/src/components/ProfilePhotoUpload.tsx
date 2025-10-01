'use client';

import { useState, useRef } from 'react';
import { FaCamera, FaTimes, FaSpinner } from 'react-icons/fa';
import { presignProfileUpload, updateUserProfile } from '@/app/api/users';
import { uploadFile, validateFile, createPreviewUrl, revokePreviewUrl } from '@/app/lib/uploadUtils';

interface ProfilePhotoUploadProps {
  currentAvatar?: string;
  onAvatarUpdate: (newAvatar: string) => void;
  userId: string;
  className?: string;
}

export default function ProfilePhotoUpload({ 
  currentAvatar, 
  onAvatarUpdate, 
  userId,
  className = '' 
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Create preview URL
    const newPreviewUrl = createPreviewUrl(file);
    setPreviewUrl(newPreviewUrl);
    setError(null);

    // Upload file
    await uploadProfilePhoto(file);
  };

  const uploadProfilePhoto = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);

      // Get presigned URL
      const presignResponse = await presignProfileUpload();
      
      // Upload file to S3
      const uploadResponse = await fetch(presignResponse.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Update user profile with new avatar URL
      await updateUserProfile({ avatar: presignResponse.downloadUrl });
      
      // Update parent component
      onAvatarUpdate(presignResponse.downloadUrl);
      
      // Clean up preview URL
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
      }
      setPreviewUrl(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Profile photo upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload profile photo');
      
      // Clean up preview URL on error
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setIsUploading(true);
      setError(null);

      // Update user profile to remove avatar
      await updateUserProfile({ avatar: '' });
      
      // Update parent component
      onAvatarUpdate('');
      
    } catch (error) {
      console.error('Remove profile photo error:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove profile photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const displayAvatar = previewUrl || currentAvatar;

  return (
    <div className={`relative ${className}`}>
      {/* Profile Photo */}
      <div className="relative group">
        <div 
          className={`w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer transition-all duration-200 ${
            isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500'
          }`}
          onClick={handleClick}
        >
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to default avatar
                const target = e.target as HTMLImageElement;
                target.src = '/default-avatar.svg';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
              <FaCamera className="h-8 w-8 text-white" />
            </div>
          )}
        </div>

        {/* Upload Overlay */}
        {!isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200">
            <FaCamera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <FaSpinner className="h-6 w-6 text-white animate-spin" />
          </div>
        )}

        {/* Remove Button */}
        {currentAvatar && !isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemovePhoto();
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
          >
            <FaTimes className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Upload Instructions */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Click to upload
        <br />
        PNG, JPG, GIF, WebP up to 10MB
      </div>
    </div>
  );
}
