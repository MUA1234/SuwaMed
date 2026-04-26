import client from './client';

export const createAppointment = async (data: any) => {
  const response = await client.post('/appointments', data);
  return response.data;
};

export const getAppointments = async (params?: any) => {
  const response = await client.get('/appointments', { params });
  return response.data;
};

export const getAppointmentById = async (id: string) => {
  const response = await client.get(`/appointments/${id}`);
  return response.data;
};

export const confirmAppointment = async (id: string) => {
  const response = await client.put(`/appointments/${id}/confirm`);
  return response.data;
};

export const cancelAppointment = async (id: string, reason: string) => {
  const response = await client.put(`/appointments/${id}/cancel`, { reason });
  return response.data;
};

export const rescheduleAppointment = async (id: string, data: any) => {
  const response = await client.put(`/appointments/${id}/reschedule`, data);
  return response.data;
};

export const startConsultation = async (id: string) => {
  const response = await client.put(`/appointments/${id}/start`);
  return response.data;
};

export const endConsultation = async (id: string) => {
  const response = await client.put(`/appointments/${id}/end`);
  return response.data;
};

export const addNotes = async (id: string, notes: string) => {
  const response = await client.put(`/appointments/${id}/notes`, { notes });
  return response.data;
};
