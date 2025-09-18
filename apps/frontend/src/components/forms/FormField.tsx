'use client';

import React from 'react';
import { FieldError, FieldPath, FieldValues, UseFormRegister } from 'react-hook-form';

interface FormFieldProps<T extends FieldValues> {
  label: string;
  name: FieldPath<T>;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  register: UseFormRegister<T>;
  error?: FieldError;
  options?: { value: string; label: string }[];
  rows?: number;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export function FormField<T extends FieldValues>({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  register,
  error,
  options = [],
  rows = 3,
  className = '',
  inputClassName = '',
  labelClassName = '',
  errorClassName = '',
}: FormFieldProps<T>) {
  const baseInputClasses = `
    w-full px-3 py-2 border rounded-lg transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    mobile-input
    ${error 
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 hover:border-gray-400'
    }
    ${inputClassName}
  `.trim();

  const baseLabelClasses = `
    block text-sm font-medium text-gray-700 mb-1
    ${required ? 'after:content-["*"] after:text-red-500 after:ml-1' : ''}
    ${labelClassName}
  `.trim();

  const baseErrorClasses = `
    text-sm text-red-600 mt-1 mobile-error
    ${errorClassName}
  `.trim();

  const renderInput = () => {
    const commonProps = {
      ...register(name),
      placeholder,
      disabled,
      className: baseInputClasses,
      'aria-invalid': error ? 'true' : 'false',
      'aria-describedby': error ? `${name}-error` : undefined,
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
          </select>
        );

      default:
        return (
          <input
            {...commonProps}
            type={type}
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
      
      {error && (
        <div id={`${name}-error`} className={baseErrorClasses} role="alert">
          {error.message}
        </div>
      )}
    </div>
  );
}
