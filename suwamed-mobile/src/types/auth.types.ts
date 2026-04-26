export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor';
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  district?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface OTPRequest {
  phone: string;
  otp: string;
}

export interface User {
  _id: string;
  email: string;
  phone: string;
  role: 'patient' | 'doctor' | 'admin';
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: Address;
  language: 'en' | 'si' | 'ta';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street?: string;
  city?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}
