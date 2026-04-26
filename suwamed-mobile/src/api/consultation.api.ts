import client from './client';

export const getToken = async (data: any) => {
  const response = await client.post('/consultations/token', data);
  return response.data;
};

export const getMessages = async (id: string, params?: any) => {
  const response = await client.get(`/consultations/${id}/messages`, { params });
  return response.data;
};

export const sendMessage = async (id: string, data: any) => {
  const response = await client.post(`/consultations/${id}/messages`, data);
  return response.data;
};
