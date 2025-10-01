'use client';

import React, { useState, useRef } from 'react';
import { FaUpload, FaTimes, FaImage, FaPlus } from 'react-icons/fa';
import { presignListingUpload } from '@/app/api/listings';
import { validateFile } from '@/app/lib/uploadUtils';
import { toast } from 'react-hot-toast';

interface ListingImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ListingImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  disabled = false,
}: ListingImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (files: FileList) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    if (fileArray.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image(s). Maximum ${maxImages} images allowed.`);
      return;
    }

    setUploading(true);
    const newImages: string[] = [...images];
    
    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        // Validate file
        const validation = validateFile(file);
        if (!validation.isValid) {
          toast.error(`File ${file.name}: ${validation.error}`);
          continue;
        }

        const fileId = `${Date.now()}_${i}`;
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        try {
          // Get presigned URL
          const presignResponse = await presignListingUpload(file.name, file.type);
          
          if (!presignResponse.success) {
            throw new Error('Failed to get upload URL');
          }

          // Upload file directly to S3
          const uploadResponse = await fetch(presignResponse.presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
          }

          // Add to images array
          newImages.push(presignResponse.downloadUrl);
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
          
        } catch (error: any) {
          console.error('Upload error for file:', file.name, error);
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
        } finally {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }
      }

      onImagesChange(newImages);
      
      if (newImages.length > images.length) {
        toast.success(`${newImages.length - images.length} image(s) uploaded successfully!`);
      }

    } finally {
      setUploading(false);
      // Clear the input value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    if (disabled) return;
    
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success('Image removed');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files);
    }
  };

  const canUploadMore = images.length < maxImages && !disabled;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Product Images
        </label>
        <span className="text-sm text-gray-500">
          {images.length}/{maxImages} images
        </span>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        disabled={disabled || !canUploadMore}
      />

      {/* Image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Existing images */}
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
              <img
                src={image}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default-listing.svg';
                }}
              />
            </div>
            
            {/* Remove button */}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              >
                <FaTimes />
              </button>
            )}
          </div>
        ))}

        {/* Upload button */}
        {canUploadMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
            ) : (
              <>
                <FaPlus className="h-6 w-6 mb-2" />
                <span className="text-xs text-center">Add Image</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Upload progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <p className="text-sm text-gray-500">
        Upload up to {maxImages} images (JPEG, PNG, GIF, WebP). Maximum 10MB per image.
        {images.length === 0 && (
          <span className="text-amber-600 font-medium"> At least one image is recommended.</span>
        )}
      </p>
    </div>
  );
}
