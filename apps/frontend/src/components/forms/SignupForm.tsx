'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signupUser } from '@/app/api/auth';
import { useFormValidation } from '@/hooks/useFormValidation';
import { signupSchema, SignupFormData } from '@/app/lib/validation/schemas';
import { FormField } from './FormField';
import { FormButton } from './FormButton';
import { toast } from 'react-hot-toast';
import { FaInfoCircle } from 'react-icons/fa';

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
    setValue,
  } = useFormValidation<SignupFormData>({
    schema: signupSchema,
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      displayName: '',
      role: 'buyer',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  // Watch fields for real-time validation
  const email = watchField('email');
  const password = watchField('password');
  const confirmPassword = watchField('confirmPassword');
  const name = watchField('name');
  const displayName = watchField('displayName');
  const role = watchField('role');

  // Enable submit immediately when values are valid per schema
  const canSubmit = signupSchema.safeParse({ email, password, confirmPassword, name, displayName, role }).success && !isLoading;

  const onSubmit = async (data: SignupFormData) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await signupUser({
        email: data.email,
        password: data.password,
        name: data.name,
        displayName: data.displayName,
        role: data.role,
      });
      
      toast.success('Account created successfully! Please check your email to verify your account.', { duration: 5000 });
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to login after successful signup
        setTimeout(() => {
          router.push(`/${params.locale}/login`);
        }, 3000);
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
      {/* Role Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          I want to join as a:
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="buyer"
              {...register('role')}
              className="mr-2 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Buyer</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="seller"
              {...register('role')}
              className="mr-2 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Seller</span>
          </label>
        </div>
        {errors.role && (
          <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
        )}
      </div>

      {/* Name Field */}
      <FormField
        label="Full Name"
        name="name"
        type="text"
        placeholder="Enter your full name"
        required
        register={register}
        error={errors.name}
        className="w-full"
      />

      {/* Display Name Field - Only for Sellers */}
      {role === 'seller' && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <label className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <div className="relative group">
              <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Add your shop's name or business name
              </div>
            </div>
          </div>
          <input
            type="text"
            placeholder="e.g., Sarah's Shop, Antique Guys..."
            {...register('displayName')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.displayName && (
            <p className="text-red-500 text-xs mt-1">{errors.displayName.message}</p>
          )}
        </div>
      )}

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

      <div className="space-y-2">
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
        <div className="text-xs text-gray-600 space-y-1 px-1">
          <p className="font-medium">Password must contain:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>At least 8 characters</li>
            <li>One uppercase letter (A-Z)</li>
            <li>One lowercase letter (a-z)</li>
            <li>One number (0-9)</li>
            <li>One special character (!@#$%^&*)</li>
          </ul>
        </div>
      </div>

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
        disabled={!canSubmit}
        className="mt-6"
      >
        {isLoading ? t('signup.button') : t('signup.button')}
      </FormButton>
    </form>
  );
}
