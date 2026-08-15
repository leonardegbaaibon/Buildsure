import { useState, useCallback } from 'react';

/**
 * Standard Email Regex validation
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Nigerian Phone Number Regex validation:
 * Supports:
 * - 070xxxxxxxx, 080xxxxxxxx, 081xxxxxxxx, 090xxxxxxxx, 091xxxxxxxx (11 digits)
 * - 70xxxxxxxx, 80xxxxxxxx, 81xxxxxxxx, 90xxxxxxxx, 91xxxxxxxx (10 digits without leading 0)
 * - +23470xxxxxxxx, +23480xxxxxxxx, etc. (with +234 prefix)
 */
export const NIGERIAN_PHONE_REGEX = /^(?:\+?234|0)?[789][01]\d{8}$/;

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validate an email address
 */
export function validateEmail(email: string, required = true): ValidationResult {
  const trimmed = email ? email.trim() : '';

  if (!trimmed) {
    if (required) {
      return { isValid: false, error: 'Email address is required' };
    }
    return { isValid: true, error: null };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@domain.com)' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate a Nigerian phone number
 */
export function validateNigerianPhone(phone: string, required = true): ValidationResult {
  // Strip non-digit characters except leading plus
  const cleaned = phone ? phone.replace(/[\s\-\(\)]/g, '') : '';

  if (!cleaned) {
    if (required) {
      return { isValid: false, error: 'Phone number is required' };
    }
    return { isValid: true, error: null };
  }

  if (!NIGERIAN_PHONE_REGEX.test(cleaned)) {
    return {
      isValid: false,
      error: 'Please enter a valid Nigerian phone number (e.g. 08012345678 or 8012345678)',
    };
  }

  return { isValid: true, error: null };
}

/**
 * Reusable validation hook for forms
 */
export function useValidation() {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const validateEmailField = useCallback((email: string, required = true): boolean => {
    const result = validateEmail(email, required);
    setEmailError(result.error);
    return result.isValid;
  }, []);

  const validatePhoneField = useCallback((phone: string, required = true): boolean => {
    const result = validateNigerianPhone(phone, required);
    setPhoneError(result.error);
    return result.isValid;
  }, []);

  const clearValidationErrors = useCallback(() => {
    setEmailError(null);
    setPhoneError(null);
  }, []);

  return {
    emailError,
    phoneError,
    validateEmail: validateEmailField,
    validatePhone: validatePhoneField,
    clearErrors: clearValidationErrors,
    setEmailError,
    setPhoneError,
  };
}
