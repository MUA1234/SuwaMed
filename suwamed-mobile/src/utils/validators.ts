import { z } from 'zod';

export const loginSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, 'Email or phone is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters'),
  email: z
    .string()
    .email('Invalid email address'),
  phone: z
    .string()
    .regex(/^(\+94|94|0)?[0-9]{9}$/, 'Invalid Sri Lankan phone number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  district: z.string().optional(),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, 'Email or phone is required'),
});

export const resetPasswordSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  district: z.string().optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
});

export const appointmentSchema = z.object({
  doctorId: z.string().min(1, 'Doctor is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Time slot is required'),
  endTime: z.string().min(1, 'End time is required'),
  type: z.enum(['video', 'chat', 'follow_up']),
  reason: z.string().optional(),
});

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
  isAnonymous: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
