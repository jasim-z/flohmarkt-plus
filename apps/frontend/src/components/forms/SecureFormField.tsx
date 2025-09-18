/**
 * SecureFormField - Enhanced form field with built-in sanitization and security
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FieldError, UseFormRegister, Path, FieldValues } from 'react-hook-form';
import { 
  sanitizeText, 
  sanitizeTextarea, 
  validatePhoneNumber, 
  sanitizeEmail,
  CHARACTER_LIMITS 
} from '@/app/lib/security/inputSanitizer';

interface SecureFormFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  disabled?: boolean;
  readOnly?: boolean;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  maxLength?: number;
  options?: Array<{ value: string; label: string }>;
  children?: React.ReactNode;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  sanitize?: boolean; // Whether to apply sanitization
  showCharCount?: boolean; // Whether to show character count
}

export function SecureFormField<T extends FieldValues>({
  label,
  name,
  register,
  error,
  type = 'text',
  placeholder,
  required = false,
  className = '',
  inputClassName = '',
  labelClassName = '',
  disabled = false,
  readOnly = false,
  min,
  max,
  step,
  rows = 3,
  maxLength,
  options = [],
  children,
  onBlur,
  onChange,
  sanitize = true,
  showCharCount = false,
}: SecureFormFieldProps<T>) {
  const [charCount, setCharCount] = useState(0);
  const [isValidLength, setIsValidLength] = useState(true);

  // Determine max length based on field type
  const getMaxLength = (): number => {
    if (maxLength) return maxLength;
    
    switch (type) {
      case 'textarea':
        return CHARACTER_LIMITS.DESCRIPTION;
      case 'text':
        if (name.toString().includes('title')) return CHARACTER_LIMITS.TITLE;
        if (name.toString().includes('description')) return CHARACTER_LIMITS.DESCRIPTION;
        return CHARACTER_LIMITS.SHORT_TEXT;
      default:
        return CHARACTER_LIMITS.SHORT_TEXT;
    }
  };

  const effectiveMaxLength = getMaxLength();

  const baseInputClasses = `
    w-full px-3 py-2 border rounded-lg transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    mobile-input
    ${error 
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 hover:border-gray-400'
    }
    ${!isValidLength ? 'border-orange-400 focus:ring-orange-400' : ''}
    ${inputClassName}
  `.trim();

  const baseLabelClasses = `
    block text-sm font-medium text-gray-700 mb-1
    ${required ? 'after:content-["*"] after:text-red-500 after:ml-1' : ''}
    ${labelClassName}
  `.trim();

  const baseErrorClasses = `
    text-sm text-red-600 mt-1 mobile-error
  `.trim();

  // Handle input change with sanitization
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { value } = e.target;
    let sanitizedValue = value;

    // Apply sanitization based on field type
    if (sanitize && typeof value === 'string') {
      switch (type) {
        case 'email':
          sanitizedValue = sanitizeEmail(value);
          break;
        case 'tel':
          const phoneValidation = validatePhoneNumber(value);
          sanitizedValue = phoneValidation.formatted;
          break;
        case 'textarea':
          const textareaResult = sanitizeTextarea(value, effectiveMaxLength);
          sanitizedValue = textareaResult.sanitized;
          setIsValidLength(textareaResult.isValid);
          break;
        default:
          sanitizedValue = sanitizeText(value);
          break;
      }
    }

    // Update character count
    if (showCharCount || type === 'textarea') {
      setCharCount(sanitizedValue.length);
    }

    // Create new event with sanitized value
    const sanitizedEvent = {
      ...e,
      target: {
        ...e.target,
        value: sanitizedValue
      }
    } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

    // Call original onChange if provided
    if (onChange) {
      onChange(sanitizedEvent);
    }
  };

  // Handle blur with additional validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (type === 'tel') {
      const phoneValidation = validatePhoneNumber(e.target.value);
      if (!phoneValidation.isValid) {
        // You could set an error here if needed
        console.warn('Invalid phone number:', phoneValidation.error);
      }
    }

    if (onBlur) {
      onBlur(e);
    }
  };

  const renderInput = () => {
    const commonProps = {
      ...register(name),
      placeholder,
      disabled,
      readOnly,
      onBlur: handleBlur,
      onChange: handleChange,
      className: baseInputClasses,
      'aria-invalid': error ? 'true' : 'false',
      'aria-describedby': error ? `${name}-error` : undefined,
      maxLength: effectiveMaxLength,
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
            aria-describedby={error ? `${name}-error` : undefined}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            {children}
          </select>
        );

      default:
        return (
          <input
            {...commonProps}
            type={type}
            min={min}
            max={max}
            step={step}
          />
        );
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className={baseLabelClasses}>
        {label}
      </label>
      
      {renderInput()}
      
      {/* Character count and validation feedback */}
      {(showCharCount || type === 'textarea') && (
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            {charCount} / {effectiveMaxLength} characters
          </span>
          {!isValidLength && (
            <span className="text-orange-600">
              Text will be truncated at {effectiveMaxLength} characters
            </span>
          )}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <p id={`${name}-error`} className={baseErrorClasses}>
          {error.message}
        </p>
      )}
    </div>
  );
}

