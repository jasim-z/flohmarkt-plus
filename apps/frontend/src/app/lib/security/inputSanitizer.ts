/**
 * Input Sanitization and Security Utilities
 * 
 * This module provides comprehensive input sanitization and validation
 * to prevent XSS attacks and ensure data integrity.
 */

import DOMPurify from 'dompurify';

// File upload validation constants
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALL: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
} as const;

export const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  GENERAL: 5 * 1024 * 1024, // 5MB
} as const;

// Character limits for different input types
export const CHARACTER_LIMITS = {
  TITLE: 100,
  DESCRIPTION: 1000,
  SHORT_TEXT: 50,
  MEDIUM_TEXT: 200,
  LONG_TEXT: 500,
  COMMENT: 500,
  BIO: 1000,
} as const;

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string, options?: DOMPurify.Config): string {
  if (typeof window === 'undefined') {
    // Server-side: strip all HTML tags
    return html.replace(/<[^>]*>/g, '');
  }
  
  const defaultConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [], // Strip all HTML tags by default
    ALLOWED_ATTR: [], // Strip all attributes
    KEEP_CONTENT: true, // Keep text content
    ...options
  };
  
  return DOMPurify.sanitize(html, defaultConfig);
}

/**
 * Sanitizes plain text input by stripping HTML and normalizing whitespace
 * @param text - The text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Strip HTML tags
  const stripped = sanitizeHtml(text);
  
  // Normalize whitespace
  return stripped
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing whitespace
}

/**
 * Sanitizes textarea content with character limit enforcement
 * @param text - The text to sanitize
 * @param maxLength - Maximum allowed characters
 * @returns Sanitized text with length validation
 */
export function sanitizeTextarea(text: string, maxLength: number = CHARACTER_LIMITS.DESCRIPTION): {
  sanitized: string;
  isValid: boolean;
  remainingChars: number;
} {
  const sanitized = sanitizeText(text);
  const isValid = sanitized.length <= maxLength;
  const remainingChars = Math.max(0, maxLength - sanitized.length);
  
  return {
    sanitized: isValid ? sanitized : sanitized.substring(0, maxLength),
    isValid,
    remainingChars
  };
}

/**
 * Validates and formats phone numbers
 * @param phone - The phone number to validate
 * @returns Validation result with formatted number
 */
export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  formatted: string;
  error?: string;
} {
  if (!phone) {
    return { isValid: false, formatted: '', error: 'Phone number is required' };
  }
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it's a valid length (7-15 digits)
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { 
      isValid: false, 
      formatted: phone, 
      error: 'Phone number must be between 7 and 15 digits' 
    };
  }
  
  // Format based on length
  let formatted = digitsOnly;
  if (digitsOnly.length === 10) {
    // US format: (XXX) XXX-XXXX
    formatted = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    // US format with country code: +1 (XXX) XXX-XXXX
    const withoutCountryCode = digitsOnly.slice(1);
    formatted = `+1 (${withoutCountryCode.slice(0, 3)}) ${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6)}`;
  } else if (digitsOnly.length > 10) {
    // International format: +XX XXX XXX XXXX
    formatted = `+${digitsOnly}`;
  }
  
  return { isValid: true, formatted, error: undefined };
}

/**
 * Validates file upload
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns Validation result
 */
export function validateFileUpload(
  file: File, 
  allowedTypes: string[] = ALLOWED_FILE_TYPES.ALL,
  maxSize: number = MAX_FILE_SIZES.GENERAL
): {
  isValid: boolean;
  error?: string;
  warnings?: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
  }
  
  // Check for suspicious file extensions
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
  const fileName = file.name.toLowerCase();
  if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
    errors.push('Executable files are not allowed');
  }
  
  // Check for very large files (warning)
  if (file.size > maxSize * 0.8) {
    warnings.push('File is close to size limit');
  }
  
  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validates multiple file uploads
 * @param files - Array of files to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @param maxFiles - Maximum number of files allowed
 * @returns Validation result
 */
export function validateMultipleFileUpload(
  files: File[],
  allowedTypes: string[] = ALLOWED_FILE_TYPES.ALL,
  maxSize: number = MAX_FILE_SIZES.GENERAL,
  maxFiles: number = 10
): {
  isValid: boolean;
  errors: string[];
  validFiles: File[];
  invalidFiles: File[];
} {
  const errors: string[] = [];
  const validFiles: File[] = [];
  const invalidFiles: File[] = [];
  
  // Check total number of files
  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed, got ${files.length}`);
  }
  
  // Validate each file
  files.forEach((file, index) => {
    const validation = validateFileUpload(file, allowedTypes, maxSize);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      invalidFiles.push(file);
      errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    validFiles,
    invalidFiles
  };
}

/**
 * Sanitizes email input
 * @param email - The email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Basic email sanitization
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/['"]/g, '') // Remove quotes
    .substring(0, 254); // Email length limit
}

/**
 * Sanitizes URL input
 * @param url - The URL to sanitize
 * @returns Sanitized URL
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  // Remove any HTML tags
  const sanitized = sanitizeText(url);
  
  // Basic URL validation
  try {
    const urlObj = new URL(sanitized);
    // Only allow http and https protocols
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return urlObj.toString();
    }
  } catch {
    // Invalid URL
  }
  
  return '';
}

/**
 * Sanitizes search query input
 * @param query - The search query to sanitize
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  
  // Remove HTML and normalize
  const sanitized = sanitizeText(query);
  
  // Remove special characters that could be used for injection
  return sanitized
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .substring(0, 100); // Limit length
}

/**
 * Validates and sanitizes form data
 * @param data - The form data object
 * @param schema - Validation schema (optional)
 * @returns Sanitized and validated data
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  schema?: Partial<Record<keyof T, { maxLength?: number; type?: 'text' | 'email' | 'phone' | 'url' }>>
): T {
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    const fieldSchema = schema?.[key as keyof T];
    
    if (typeof value === 'string') {
      if (fieldSchema?.type === 'email') {
        sanitized[key] = sanitizeEmail(value);
      } else if (fieldSchema?.type === 'phone') {
        const phoneValidation = validatePhoneNumber(value);
        sanitized[key] = phoneValidation.formatted;
      } else if (fieldSchema?.type === 'url') {
        sanitized[key] = sanitizeUrl(value);
      } else {
        sanitized[key] = sanitizeText(value);
      }
      
      // Apply length limit if specified
      if (fieldSchema?.maxLength && sanitized[key].length > fieldSchema.maxLength) {
        sanitized[key] = sanitized[key].substring(0, fieldSchema.maxLength);
      }
    }
  });
  
  return sanitized;
}

/**
 * Creates a safe HTML string for display (allows basic formatting)
 * @param html - The HTML string to sanitize
 * @returns Safe HTML string
 */
export function createSafeHtml(html: string): string {
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]*>/g, '');
  }
  
  const config: DOMPurify.Config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  };
  
  return DOMPurify.sanitize(html, config);
}

