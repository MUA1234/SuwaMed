import client from './client';

export const getDashboard = async () => {
  const response = await client.get('/admin/dashboard');
  return response.data;
};

export const getUsers = async (params?: any) => {
  const response = await client.get('/admin/users', { params });
  return response.data;
};

export const getUserById = async (id: string) => {
  const response = await client.get(`/admin/users/${id}`);
  return response.data;
};

export const updateUserStatus = async (id: string, status: string) => {
  const response = await client.put(`/admin/users/${id}/status`, { status });
  return response.data;
};

export const getPendingDoctors = async () => {
  const response = await client.get('/admin/doctors/pending');
  return response.data;
};

export const verifyDoctor = async (id: string) => {
  const response = await client.put(`/admin/doctors/${id}/verify`);
  return response.data;
};

export const rejectDoctor = async (id: string, reason: string) => {
  const response = await client.put(`/admin/doctors/${id}/reject`, { reason });
  return response.data;
};

export const getAppointmentAnalytics = async () => {
  const response = await client.get('/admin/appointment-analytics');
  return response.data;
};
