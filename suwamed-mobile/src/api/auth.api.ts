import client from './client';

export const register = async (data: any) => {
  const response = await client.post('/auth/register', data);
  return response.data;
};

export const login = async (data: any) => {
  const response = await client.post('/auth/login', data);
  return response.data;
};

export const verifyOTP = async (data: any) => {
  const response = await client.post('/auth/verify-otp', data);
  return response.data;
};

export const resendOTP = async (phone: string) => {
  const response = await client.post('/auth/resend-otp', { phone });
  return response.data;
};

export const forgotPassword = async (data: any) => {
  const response = await client.post('/auth/forgot-password', data);
  return response.data;
};

export const resetPassword = async (data: any) => {
  const response = await client.post('/auth/reset-password', data);
  return response.data;
};

export const refreshToken = async (token: string) => {
  const response = await client.post('/auth/refresh-token', { refreshToken: token });
  return response.data;
};

export const logout = async () => {
  const response = await client.post('/auth/logout');
  return response.data;
};

export const getMe = async () => {
  const response = await client.get('/auth/me');
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await client.put('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};

export const deleteAccount = async (password: string) => {
  const response = await client.delete('/auth/account', { data: { password } });
  return response.data;
};
