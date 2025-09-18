/**
 * FileUploadField - Secure file upload component with validation
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { FieldError, UseFormRegister, Path, FieldValues, UseFormSetValue } from 'react-hook-form';
import { 
  validateFileUpload, 
  validateMultipleFileUpload,
  ALLOWED_FILE_TYPES, 
  MAX_FILE_SIZES 
} from '@/app/lib/security/inputSanitizer';
import { FaUpload, FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

interface FileUploadFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  error?: FieldError;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  allowedTypes?: string[];
  className?: string;
  disabled?: boolean;
  required?: boolean;
  showPreview?: boolean;
  onFilesChange?: (files: File[]) => void;
}

export function FileUploadField<T extends FieldValues>({
  label,
  name,
  register,
  setValue,
  error,
  multiple = false,
  accept,
  maxFiles = 5,
  maxSize = MAX_FILE_SIZES.IMAGE,
  allowedTypes = ALLOWED_FILE_TYPES.IMAGES,
  className = '',
  disabled = false,
  required = false,
  showPreview = true,
  onFilesChange,
}: FileUploadFieldProps<T>) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baseClasses = `
    w-full border-2 border-dashed rounded-lg transition-colors duration-200
    ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
    ${error ? 'border-red-500' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim();

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    if (multiple) {
      const validation = validateMultipleFileUpload(
        fileArray,
        allowedTypes,
        maxSize,
        maxFiles
      );
      
      if (validation.isValid) {
        setFiles(validation.validFiles);
        setValidationErrors([]);
        setValue(name, validation.validFiles as any);
        onFilesChange?.(validation.validFiles);
      } else {
        setValidationErrors(validation.errors);
        setFiles([]);
        setValue(name, [] as any);
        onFilesChange?.([]);
      }
    } else {
      const file = fileArray[0];
      if (file) {
        const validation = validateFileUpload(file, allowedTypes, maxSize);
        
        if (validation.isValid) {
          setFiles([file]);
          setValidationErrors([]);
          setValue(name, file as any);
          onFilesChange?.([file]);
        } else {
          setValidationErrors([validation.error || 'Invalid file']);
          setFiles([]);
          setValue(name, null as any);
          onFilesChange?.([]);
        }
      }
    }
  }, [multiple, allowedTypes, maxSize, maxFiles, name, setValue, onFilesChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [disabled, handleFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    setValue(name, multiple ? newFiles as any : (newFiles[0] || null) as any);
    onFilesChange?.(newFiles);
    setValidationErrors([]);
  }, [files, name, setValue, multiple, onFilesChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return '🖼️';
    } else if (file.type.startsWith('video/')) {
      return '🎥';
    } else if (file.type.includes('pdf')) {
      return '📄';
    } else if (file.type.includes('word')) {
      return '📝';
    } else {
      return '📁';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Hidden file input */}
      <input
        {...register(name)}
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept || allowedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      {/* Drop zone */}
      <div
        className={baseClasses}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <FaUpload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-gray-500">
            {allowedTypes.includes('image/') ? 'Images' : 'Files'} up to {formatFileSize(maxSize)}
            {multiple && ` (max ${maxFiles} files)`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {allowedTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()}
          </p>
        </div>
      </div>
      
      {/* File previews */}
      {showPreview && files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getFileIcon(file)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700 transition-colors"
                disabled={disabled}
              >
                <FaTimes size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="space-y-1">
          {validationErrors.map((error, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-red-600">
              <FaExclamationTriangle size={12} />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Field error */}
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-2">
          <FaExclamationTriangle size={12} />
          <span>{error.message}</span>
        </p>
      )}
      
      {/* Success message */}
      {files.length > 0 && validationErrors.length === 0 && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <FaCheck size={12} />
          <span>
            {files.length} file{files.length > 1 ? 's' : ''} ready to upload
          </span>
        </div>
      )}
    </div>
  );
}

