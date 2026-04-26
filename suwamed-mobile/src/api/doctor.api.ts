import client from './client';

export const getDoctors = async (params?: any) => {
  const response = await client.get('/doctors', { params });
  return response.data;
};

export const getDoctorById = async (id: string) => {
  const response = await client.get(`/doctors/${id}`);
  return response.data;
};

export const getDoctorAvailability = async (id: string, date: string) => {
  const response = await client.get(`/doctors/${id}/availability`, { params: { date } });
  return response.data;
};

export const getDoctorReviews = async (id: string) => {
  const response = await client.get(`/doctors/${id}/reviews`);
  return response.data;
};

export const updateProfile = async (data: any) => {
  const response = await client.put('/doctors/profile', data);
  return response.data;
};

export const setAvailability = async (data: any) => {
  const response = await client.put('/doctors/availability', data);
  return response.data;
};

export const blockSlot = async (data: any) => {
  const response = await client.post('/doctors/availability/block', data);
  return response.data;
};

export const unblockSlot = async (id: string) => {
  const response = await client.delete(`/doctors/availability/block/${id}`);
  return response.data;
};

export const toggleOnlineStatus = async (isOnline: boolean) => {
  const response = await client.put('/doctors/online-status', { isOnline });
  return response.data;
};

export const getPatients = async () => {
  const response = await client.get('/doctors/patients');
  return response.data;
};

export const getPatientDetail = async (id: string) => {
  const response = await client.get(`/doctors/patients/${id}`);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await client.get('/doctors/dashboard');
  return response.data;
};

export const getEarnings = async () => {
  const response = await client.get('/doctors/earnings');
  return response.data;
};

export const getDoctorProfile = async () => {
  const response = await client.get('/doctors/profile');
  return response.data;
};

export const uploadAvatar = async (formData: FormData) => {
  const response = await client.post('/doctors/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: (data) => data,
  });
  return response.data;
};

export const uploadVerificationDocuments = async (formData: FormData) => {
  const response = await client.post('/doctors/verification-documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: (data) => data,
  });
  return response.data;
};
