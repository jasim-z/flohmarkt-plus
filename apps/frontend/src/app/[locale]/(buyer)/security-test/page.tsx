/**
 * Security Validation Test Page
 * 
 * This page demonstrates and tests all security validation features
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  sanitizeText, 
  sanitizeTextarea, 
  validatePhoneNumber, 
  sanitizeEmail,
  validateFileUpload,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
  CHARACTER_LIMITS 
} from '@/app/lib/security/inputSanitizer';
import { SecureFormField } from '@/app/components/forms/SecureFormField';
import { FileUploadField } from '@/app/components/forms/FileUploadField';
import { FormButton } from '@/app/components/forms/FormButton';

// Test form schema
const securityTestSchema = z.object({
  textInput: z.string().min(1, 'Text input is required'),
  emailInput: z.string().email('Valid email required'),
  phoneInput: z.string().min(1, 'Phone number is required'),
  textareaInput: z.string().min(1, 'Textarea input is required'),
  urlInput: z.string().url('Valid URL required').optional(),
  fileInput: z.any().optional(),
});

type SecurityTestFormData = z.infer<typeof securityTestSchema>;

export default function SecurityTestPage() {
  const [testResults, setTestResults] = useState<any>({});
  const [files, setFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<SecurityTestFormData>({
    resolver: zodResolver(securityTestSchema),
  });

  const onSubmit = (data: SecurityTestFormData) => {
    console.log('Form submitted with data:', data);
    setTestResults(data);
  };

  // Test individual security functions
  const testSecurityFunctions = () => {
    const tests = {
      // HTML sanitization tests
      htmlSanitization: {
        input: '<script>alert("XSS")</script>Hello <b>World</b>',
        output: sanitizeText('<script>alert("XSS")</script>Hello <b>World</b>'),
        expected: 'Hello World'
      },
      
      // Email sanitization tests
      emailSanitization: {
        input: '  TEST@EXAMPLE.COM  ',
        output: sanitizeEmail('  TEST@EXAMPLE.COM  '),
        expected: 'test@example.com'
      },
      
      // Phone number validation tests
      phoneValidation: {
        input: '123-456-7890',
        result: validatePhoneNumber('123-456-7890'),
      },
      
      // Textarea sanitization tests
      textareaSanitization: {
        input: '<p>This is a <script>alert("test")</script> test with <b>HTML</b> tags</p>',
        result: sanitizeTextarea('<p>This is a <script>alert("test")</script> test with <b>HTML</b> tags</p>', 100),
      },
      
      // File validation tests
      fileValidation: {
        input: 'Test file validation',
        result: validateFileUpload(
          new File(['test'], 'test.txt', { type: 'text/plain' }),
          ALLOWED_FILE_TYPES.ALL,
          MAX_FILE_SIZES.GENERAL
        ),
      }
    };
    
    setTestResults(tests);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Security Validation Test Page
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Testing Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Secure Form Testing
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <SecureFormField
                  label="Text Input (HTML will be stripped)"
                  name="textInput"
                  register={register}
                  error={errors.textInput}
                  placeholder="Try: <script>alert('test')</script>Hello World"
                  showCharCount
                />
                
                <SecureFormField
                  label="Email Input (will be sanitized)"
                  name="emailInput"
                  type="email"
                  register={register}
                  error={errors.emailInput}
                  placeholder="test@example.com"
                />
                
                <SecureFormField
                  label="Phone Number (will be formatted)"
                  name="phoneInput"
                  type="tel"
                  register={register}
                  error={errors.phoneInput}
                  placeholder="123-456-7890"
                />
                
                <SecureFormField
                  label="Textarea (character limit enforced)"
                  name="textareaInput"
                  type="textarea"
                  register={register}
                  error={errors.textareaInput}
                  placeholder="Try pasting HTML content here..."
                  showCharCount
                  rows={4}
                />
                
                <SecureFormField
                  label="URL Input (will be validated)"
                  name="urlInput"
                  type="url"
                  register={register}
                  error={errors.urlInput}
                  placeholder="https://example.com"
                />
                
                <FileUploadField
                  label="File Upload (validation enforced)"
                  name="fileInput"
                  register={register}
                  setValue={setValue}
                  error={errors.fileInput}
                  multiple={true}
                  maxFiles={3}
                  allowedTypes={ALLOWED_FILE_TYPES.IMAGES}
                  maxSize={MAX_FILE_SIZES.IMAGE}
                  onFilesChange={setFiles}
                />
                
                <FormButton type="submit" fullWidth>
                  Test Form Security
                </FormButton>
              </form>
            </div>
            
            {/* Security Function Testing Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Security Function Testing
              </h2>
              
              <div className="space-y-4">
                <button
                  onClick={testSecurityFunctions}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Run Security Tests
                </button>
                
                {Object.keys(testResults).length > 0 && (
                  <div className="bg-gray-100 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Test Results:</h3>
                    <pre className="text-sm text-gray-700 overflow-auto max-h-96">
                      {JSON.stringify(testResults, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Character Limits Reference */}
          <div className="mt-8 bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Character Limits Reference:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Title:</span> {CHARACTER_LIMITS.TITLE}
              </div>
              <div>
                <span className="font-medium">Description:</span> {CHARACTER_LIMITS.DESCRIPTION}
              </div>
              <div>
                <span className="font-medium">Short Text:</span> {CHARACTER_LIMITS.SHORT_TEXT}
              </div>
              <div>
                <span className="font-medium">Medium Text:</span> {CHARACTER_LIMITS.MEDIUM_TEXT}
              </div>
            </div>
          </div>
          
          {/* Security Features List */}
          <div className="mt-8 bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Implemented Security Features:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✅ HTML tag stripping and XSS prevention</li>
              <li>✅ Email sanitization and validation</li>
              <li>✅ Phone number validation and formatting</li>
              <li>✅ File upload type and size validation</li>
              <li>✅ Character limits with real-time feedback</li>
              <li>✅ Textarea content sanitization</li>
              <li>✅ URL validation and sanitization</li>
              <li>✅ Form data sanitization</li>
              <li>✅ Suspicious file extension detection</li>
              <li>✅ Real-time validation feedback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

