'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { loginUser } from '@/app/api/auth';
import { useFormValidation } from '@/app/hooks/useFormValidation';
import { loginSchema, LoginFormData } from '@/app/lib/validation/schemas';
import { FormField } from './FormField';
import { FormButton } from './FormButton';
import { toast } from 'react-hot-toast';

interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function LoginForm({ onSuccess, className = '' }: LoginFormProps) {
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
  } = useFormValidation<LoginFormData>({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  // Watch fields for real-time validation
  const email = watchField('email');
  const password = watchField('password');

  // Enable submit as soon as current values are valid (no need to blur)
  const canSubmit = loginSchema.safeParse({ email, password }).success && !isLoading;

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await loginUser(data.email, data.password);
      toast.success(t('login.success'));
      
      // Redirect based on user role (this will be handled by UserContext)
      if (onSuccess) {
        onSuccess();
      } else {
        // Default redirect logic
        router.push(`/${params.locale}/home`);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error?.message || t('login.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${className}`}>
      <FormField
        label={t('login.email')}
        name="email"
        type="email"
        placeholder={t('login.email')}
        required
        register={register}
        error={errors.email}
        className="w-full"
      />

      <FormField
        label={t('login.password')}
        name="password"
        type="password"
        placeholder={t('login.password')}
        required
        register={register}
        error={errors.password}
        className="w-full"
      />

      <FormButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isLoading}
        disabled={!canSubmit}
        className="mt-6"
      >
        {isLoading ? t('login.button') : t('login.button')}
      </FormButton>
    </form>
  );
}
