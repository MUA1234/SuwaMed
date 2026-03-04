import Joi from 'joi';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const phonePattern = /^\+94\d{9}$/;

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(phonePattern).required().messages({
    'string.pattern.base': 'Phone number must be a valid Sri Lankan number starting with +94',
  }),
  password: Joi.string().min(8).pattern(passwordPattern).required().messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  }),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('patient', 'doctor').required(),
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  district: Joi.string().optional(),
  // Doctor-specific fields
  slmcRegistrationNo: Joi.when('role', {
    is: 'doctor',
    then: Joi.string().required().messages({
      'any.required': 'SLMC Registration Number is required for doctors',
    }),
    otherwise: Joi.string().optional(),
  }),
  specialization: Joi.when('role', {
    is: 'doctor',
    then: Joi.array().items(Joi.string()).min(1).required().messages({
      'array.min': 'At least one specialization is required',
      'any.required': 'Specialization is required for doctors',
    }),
    otherwise: Joi.array().items(Joi.string()).optional(),
  }),
  consultationFee: Joi.when('role', {
    is: 'doctor',
    then: Joi.number().min(0).required().messages({
      'any.required': 'Consultation fee is required for doctors',
    }),
    otherwise: Joi.number().optional(),
  }),
  experience: Joi.number().optional(),
  bio: Joi.string().max(500).optional(),
  languages: Joi.array().items(Joi.string().valid('en', 'si', 'ta')).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  password: Joi.string().required(),
}).or('email', 'phone');

export const otpSchema = Joi.object({
  phone: Joi.string().required(),
  otp: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.pattern.base': 'OTP must be a 6-digit number',
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
}).or('email', 'phone');

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  otp: Joi.string().length(6).pattern(/^\d{6}$/).required(),
  newPassword: Joi.string().min(8).pattern(passwordPattern).required().messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  }),
}).or('email', 'phone');

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
