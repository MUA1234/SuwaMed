import client from './client';

export const checkSymptoms = async (data: any) => {
  const response = await client.post('/symptoms/check', data);
  return response.data;
};

export const getHistory = async () => {
  const response = await client.get('/symptoms/history');
  return response.data;
};

export const getResult = async (id: string) => {
  const response = await client.get(`/symptoms/${id}`);
  return response.data;
};

export const deleteCheck = async (id: string) => {
  const response = await client.delete(`/symptoms/${id}`);
  return response.data;
};
