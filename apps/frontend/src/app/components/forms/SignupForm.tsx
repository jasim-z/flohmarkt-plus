'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signupUser } from '@/app/api/auth';
import { useFormValidation } from '@/app/hooks/useFormValidation';
import { signupSchema, SignupFormData } from '@/app/lib/validation/schemas';
import { FormField } from './FormField';
import { FormButton } from './FormButton';
import { toast } from 'react-hot-toast';

interface SignupFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function SignupForm({ onSuccess, className = '' }: SignupFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watchField,
    validationState,
  } = useFormValidation<SignupFormData>({
    schema: signupSchema,
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  // Watch fields for real-time validation
  const email = watchField('email');
  const password = watchField('password');
  const confirmPassword = watchField('confirmPassword');
  const displayName = watchField('displayName');

  const onSubmit = async (data: SignupFormData) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await signupUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      });
      
      toast.success(t('signup.success'));
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to login after successful signup
        setTimeout(() => {
          router.push(`/${params.locale}/login`);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error?.message || t('signup.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${className}`}>
      <FormField
        label={t('signup.name')}
        name="displayName"
        type="text"
        placeholder={t('signup.name')}
        required
        register={register}
        error={errors.displayName}
        className="w-full"
      />

      <FormField
        label={t('signup.email')}
        name="email"
        type="email"
        placeholder={t('signup.email')}
        required
        register={register}
        error={errors.email}
        className="w-full"
      />

      <FormField
        label={t('signup.password')}
        name="password"
        type="password"
        placeholder={t('signup.password')}
        required
        register={register}
        error={errors.password}
        className="w-full"
      />

      <FormField
        label={t('signup.confirmPassword')}
        name="confirmPassword"
        type="password"
        placeholder={t('signup.confirmPassword')}
        required
        register={register}
        error={errors.confirmPassword}
        className="w-full"
      />

      <FormButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isLoading}
        disabled={!isValid || isLoading}
        className="mt-6"
      >
        {isLoading ? t('signup.button') : t('signup.button')}
      </FormButton>

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
          <div>Valid: {isValid ? 'Yes' : 'No'}</div>
          <div>Errors: {validationState.errorCount}</div>
          <div>Dirty: {validationState.isDirty ? 'Yes' : 'No'}</div>
          <div>Password Match: {password === confirmPassword ? 'Yes' : 'No'}</div>
        </div>
      )}
    </form>
  );
}
