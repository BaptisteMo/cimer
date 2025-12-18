import { z } from 'zod';

/**
 * Login form validation schema
 *
 * Note: Password minimum is set to 4 characters for MVP/testing.
 * In production, consider increasing to 8+ characters.
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

/**
 * Signup form validation schema
 *
 * Note: Password minimum is set to 4 characters for MVP/testing.
 * In production, consider increasing to 8+ characters.
 *
 * Simplified to only email and password - additional info collected during onboarding.
 */
export const signupSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters')
    .max(100, 'Password is too long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

/**
 * TypeScript types inferred from schemas
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
