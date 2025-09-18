'use client';

import { useForm, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

interface UseFormValidationOptions<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  shouldFocusError?: boolean;
}

export function useFormValidation<T extends FieldValues>({
  schema,
  defaultValues,
  mode = 'onBlur',
  reValidateMode = 'onChange',
  shouldFocusError = true,
}: UseFormValidationOptions<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
    reValidateMode,
    shouldFocusError,
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
    watch,
    setValue,
    reset,
    clearErrors,
  } = form;

  // Clear specific field error when user starts typing
  const clearFieldError = (fieldName: Path<T>) => {
    if (errors[fieldName]) {
      clearErrors(fieldName);
    }
  };

  // Watch specific field and clear error on change
  const watchField = (fieldName: Path<T>) => {
    const value = watch(fieldName);
    
    useEffect(() => {
      if (value !== undefined && value !== '') {
        clearFieldError(fieldName);
      }
    }, [value, fieldName]);

    return value;
  };

  // Get field error message
  const getFieldError = (fieldName: Path<T>): string | undefined => {
    return errors[fieldName]?.message;
  };

  // Check if field has error
  const hasFieldError = (fieldName: Path<T>): boolean => {
    return !!errors[fieldName];
  };

  // Get all field errors
  const getAllErrors = () => {
    return errors;
  };

  // Check if form has any errors
  const hasErrors = Object.keys(errors).length > 0;

  // Get form validation state
  const validationState = {
    isValid,
    isDirty,
    hasErrors,
    isSubmitting,
    errorCount: Object.keys(errors).length,
  };

  return {
    ...form,
    handleSubmit,
    clearFieldError,
    watchField,
    getFieldError,
    hasFieldError,
    getAllErrors,
    validationState,
  };
}
