import { z } from 'zod';

// Auth Schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Listing Schemas
export const createListingSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .max(999999, 'Price must be less than $999,999'),
  isFree: z.boolean(),
  category: z
    .string()
    .min(1, 'Category is required'),
  condition: z
    .string()
    .min(1, 'Condition is required'),
  city: z
    .string()
    .min(1, 'City is required')
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City must be less than 50 characters'),
  neighborhood: z
    .string()
    .min(1, 'Neighborhood is required')
    .min(2, 'Neighborhood must be at least 2 characters')
    .max(50, 'Neighborhood must be less than 50 characters'),
  latitude: z
    .number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude'),
  longitude: z
    .number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude'),
  deliveryOption: z
    .string()
    .min(1, 'Delivery option is required'),
  shippingCost: z
    .number()
    .min(0, 'Shipping cost cannot be negative')
    .optional(),
  brand: z
    .string()
    .max(50, 'Brand must be less than 50 characters')
    .optional(),
  model: z
    .string()
    .max(50, 'Model must be less than 50 characters')
    .optional(),
  originalPrice: z
    .number()
    .min(0, 'Original price cannot be negative')
    .optional(),
  dimensions: z
    .string()
    .max(100, 'Dimensions must be less than 100 characters')
    .optional(),
  weight: z
    .string()
    .max(50, 'Weight must be less than 50 characters')
    .optional(),
  tags: z
    .array(z.string())
    .max(10, 'Maximum 10 tags allowed'),
  isNegotiable: z.boolean(),
  pickupAddress: z
    .string()
    .max(200, 'Pickup address must be less than 200 characters')
    .optional(),
  pickupInstructions: z
    .string()
    .max(500, 'Pickup instructions must be less than 500 characters')
    .optional(),
}).refine((data) => {
  if (!data.isFree && data.price <= 0) {
    return false;
  }
  return true;
}, {
  message: 'Price is required for non-free items',
  path: ['price'],
}).refine((data) => {
  if (data.deliveryOption === 'shipping' && (!data.shippingCost || data.shippingCost < 0)) {
    return false;
  }
  return true;
}, {
  message: 'Shipping cost is required for shipping delivery',
  path: ['shippingCost'],
});

// Market Schemas
export const createMarketSchema = z.object({
  name: z
    .string()
    .min(1, 'Market name is required')
    .min(3, 'Market name must be at least 3 characters')
    .max(100, 'Market name must be less than 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  location: z
    .string()
    .min(1, 'Location is required')
    .min(5, 'Location must be at least 5 characters')
    .max(200, 'Location must be less than 200 characters'),
  date: z
    .string()
    .min(1, 'Date is required')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'Market date cannot be in the past'),
  startTime: z
    .string()
    .min(1, 'Start time is required')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z
    .string()
    .min(1, 'End time is required')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  isActive: z.boolean(),
  bannerImage: z
    .string()
    .url('Invalid image URL')
    .optional(),
  vendorLimit: z
    .number()
    .min(1, 'Vendor limit must be at least 1')
    .max(1000, 'Vendor limit must be less than 1000')
    .optional(),
  boothsAvailable: z
    .number()
    .min(1, 'Booths available must be at least 1')
    .max(1000, 'Booths available must be less than 1000')
    .optional(),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((price) => {
      const numPrice = parseFloat(price);
      return !isNaN(numPrice) && numPrice >= 0;
    }, 'Invalid price format'),
  categories: z
    .array(z.string())
    .min(1, 'At least one category is required')
    .max(10, 'Maximum 10 categories allowed'),
}).refine((data) => {
  const startTime = new Date(`2000-01-01T${data.startTime}`);
  const endTime = new Date(`2000-01-01T${data.endTime}`);
  return startTime < endTime;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
}).refine((data) => {
  if (data.vendorLimit && data.boothsAvailable) {
    return data.vendorLimit === data.boothsAvailable;
  }
  return true;
}, {
  message: 'Vendor limit must equal booths available',
  path: ['boothsAvailable'],
});

// Payment Schema
export const paymentSchema = z.object({
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .regex(/^\d{16}$/, 'Card number must be 16 digits'),
  expiryDate: z
    .string()
    .min(1, 'Expiry date is required')
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Invalid expiry date format (MM/YY)')
    .refine((date) => {
      const [month, year] = date.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      const cardYear = parseInt(year);
      const cardMonth = parseInt(month);
      
      if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
        return false;
      }
      return true;
    }, 'Card has expired'),
  cvv: z
    .string()
    .min(1, 'CVV is required')
    .regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
  cardholderName: z
    .string()
    .min(1, 'Cardholder name is required')
    .min(2, 'Cardholder name must be at least 2 characters')
    .max(50, 'Cardholder name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Cardholder name can only contain letters and spaces'),
});

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type CreateListingFormData = z.infer<typeof createListingSchema>;
export type CreateMarketFormData = z.infer<typeof createMarketSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
