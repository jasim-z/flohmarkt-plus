'use client';

import React, { useState } from 'react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { createListingSchema, CreateListingFormData } from '@/app/lib/validation/schemas';
import { FormField } from './FormField';
import { FormButton } from './FormButton';
import { createListingForMarket } from '@/app/api/listings';
import { toast } from 'react-hot-toast';

interface AddListingFormProps {
  marketId: string;
  marketName: string;
  marketLocation: string;
  onSuccess?: (listing: any) => void;
  onCancel?: () => void;
  className?: string;
}

const CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'books', label: 'Books' },
  { value: 'toys', label: 'Toys' },
  { value: 'sports', label: 'Sports' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'art', label: 'Art & Collectibles' },
  { value: 'other', label: 'Other' },
];

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const DELIVERY_OPTIONS = [
  { value: 'pickup_only', label: 'Pickup Only' },
  { value: 'local_delivery', label: 'Local Delivery' },
  { value: 'shipping', label: 'Shipping Available' },
];

export function AddListingForm({
  marketId,
  marketLocation,
  onSuccess,
  onCancel,
  className = '',
}: AddListingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watchField,
    setValue,
    validationState,
  } = useFormValidation<CreateListingFormData>({
    schema: createListingSchema,
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      isFree: false,
      category: '',
      condition: '',
      city: (marketLocation ?? '').split(',')[0] || '',
      neighborhood: '',
      latitude: 0,
      longitude: 0,
      deliveryOption: 'pickup_only',
      shippingCost: 0,
      // Don't set default values for optional fields
      brand: undefined,
      model: undefined,
      originalPrice: undefined,
      dimensions: undefined,
      weight: undefined,
      tags: [],
      isNegotiable: false,
      pickupAddress: undefined,
      pickupInstructions: undefined,
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  // Watch fields for real-time validation
  const price = watchField('price');
  const isFree = watchField('isFree');
  const deliveryOption = watchField('deliveryOption');

  // Handle tags input
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value;
    setTagsInput(tagsString);
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setValue('tags', tags);
  };

  // Handle free checkbox
  const handleFreeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setValue('isFree', isChecked);
    if (isChecked) {
      setValue('price', 0);
    }
  };

  // Handle negotiable checkbox
  const handleNegotiableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('isNegotiable', e.target.checked);
  };

  const onSubmit = async (data: CreateListingFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Clean up the data before sending
      const cleanData = { ...data };
      
      // Remove empty strings, undefined, and null values for optional fields
      const optionalStringFields = ['brand', 'model', 'dimensions', 'weight', 'pickupAddress', 'pickupInstructions'];
      optionalStringFields.forEach(field => {
        const value = cleanData[field as keyof typeof cleanData];
        if (value === '' || value === undefined || value === null) {
          delete cleanData[field as keyof typeof cleanData];
        }
      });
      
      // Remove zero, undefined, and null values for optional numeric fields
      if (cleanData.originalPrice === 0 || cleanData.originalPrice === undefined || cleanData.originalPrice === null) {
        delete cleanData.originalPrice;
      }
      
      // Only include shippingCost if delivery option requires it and it's greater than 0
      if (cleanData.deliveryOption !== 'shipping' && (cleanData.shippingCost === 0 || cleanData.shippingCost === undefined || cleanData.shippingCost === null)) {
        delete cleanData.shippingCost;
      }

      const listingData = {
        ...cleanData,
        marketId,
        // Ensure price is a number
        price: cleanData.isFree ? 0 : Number(cleanData.price),
      };

      const result = await createListingForMarket(listingData);
      toast.success('Listing created successfully!');
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error: any) {
      console.error('Error creating listing:', error);
      toast.error(error?.message || 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${className}`}>
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        
        <FormField
          label="Title"
          name="title"
          type="text"
          placeholder="Enter listing title"
          required
          register={register}
          error={errors.title}
        />

        <FormField
          label="Description"
          name="description"
          type="textarea"
          placeholder="Describe your item in detail"
          required
          rows={4}
          register={register}
          error={errors.description}
        />

        <div className="flex items-center space-x-4">
          <FormField
            label="Category"
            name="category"
            type="select"
            required
            register={register}
            error={errors.category}
            options={CATEGORIES}
            className="flex-1"
          />

          <FormField
            label="Condition"
            name="condition"
            type="select"
            required
            register={register}
            error={errors.condition}
            options={CONDITIONS}
            className="flex-1"
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isFree"
            checked={isFree}
            onChange={handleFreeChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isFree" className="text-sm font-medium text-gray-700">
            This item is free
          </label>
        </div>

        {!isFree && (
          <FormField
            label="Price"
            name="price"
            type="number"
            placeholder="0.00"
            required
            register={register}
            error={errors.price}
            inputClassName="pr-8"
          />
        )}

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isNegotiable"
            checked={watchField('isNegotiable')}
            onChange={handleNegotiableChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isNegotiable" className="text-sm font-medium text-gray-700">
            Price is negotiable
          </label>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Location</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="City"
            name="city"
            type="text"
            placeholder="Enter city"
            required
            register={register}
            error={errors.city}
          />

          <FormField
            label="Neighborhood"
            name="neighborhood"
            type="text"
            placeholder="Enter neighborhood"
            required
            register={register}
            error={errors.neighborhood}
          />
        </div>
      </div>

      {/* Delivery Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Delivery Options</h3>
        
        <FormField
          label="Delivery Method"
          name="deliveryOption"
          type="select"
          required
          register={register}
          error={errors.deliveryOption}
          options={DELIVERY_OPTIONS}
        />

        {(deliveryOption === 'shipping' || deliveryOption === 'local_delivery') && (
          <FormField
            label="Shipping Cost"
            name="shippingCost"
            type="number"
            placeholder="0.00"
            required
            register={register}
            error={errors.shippingCost}
            inputClassName="pr-8"
          />
        )}

        {deliveryOption === 'pickup' && (
          <FormField
            label="Pickup Address"
            name="pickupAddress"
            type="text"
            placeholder="Enter pickup address"
            register={register}
            error={errors.pickupAddress}
          />
        )}

        <FormField
          label="Pickup Instructions"
          name="pickupInstructions"
          type="textarea"
          placeholder="Any special pickup instructions"
          rows={2}
          register={register}
          error={errors.pickupInstructions}
        />
      </div>

      {/* Additional Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Brand"
            name="brand"
            type="text"
            placeholder="Enter brand name"
            register={register}
            error={errors.brand}
          />

          <FormField
            label="Model"
            name="model"
            type="text"
            placeholder="Enter model name"
            register={register}
            error={errors.model}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Original Price"
            name="originalPrice"
            type="number"
            placeholder="0.00"
            register={register}
            error={errors.originalPrice}
            inputClassName="pr-8"
          />

          <FormField
            label="Dimensions"
            name="dimensions"
            type="text"
            placeholder="e.g., 10x5x3 inches"
            register={register}
            error={errors.dimensions}
          />
        </div>

        <FormField
          label="Weight"
          name="weight"
          type="text"
          placeholder="e.g., 2.5 lbs"
          register={register}
          error={errors.weight}
        />

        <FormField
          label="Tags (comma-separated)"
          name="tags"
          type="text"
          placeholder="vintage, collectible, handmade"
          register={register}
          error={errors.tags}
          onChange={handleTagsChange}
        />
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <FormButton
          type="button"
          variant="outline"
          size="lg"
          fullWidth
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </FormButton>
        
        <FormButton
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Listing'}
        </FormButton>
      </div>

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
          <div>Valid: {isValid ? 'Yes' : 'No'}</div>
          <div>Errors: {validationState.errorCount}</div>
          <div>Dirty: {validationState.isDirty ? 'Yes' : 'No'}</div>
          <div>Free: {isFree ? 'Yes' : 'No'}</div>
          <div>Price: {price}</div>
        </div>
      )}
    </form>
  );
}
