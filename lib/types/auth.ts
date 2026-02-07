export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  profileImage?: string | null;
  role: 'USER' | 'ADMIN' | 'INSTRUCTOR';
  isEmailVerified: boolean;
  isActive: boolean;
  preferredPaymentMethod?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** Where to send the verification OTP */
export type OtpChannel = 'email' | 'sms' | 'both';

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  /** Where to receive OTP: email, sms, or both. Default email. */
  otpChannel?: OtpChannel;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

