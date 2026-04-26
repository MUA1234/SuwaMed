import client from './client';

export const getNotifications = async (params?: any) => {
  const response = await client.get('/notifications', { params });
  return response.data;
};

export const markAsRead = async (id: string) => {
  const response = await client.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await client.put('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id: string) => {
  const response = await client.delete(`/notifications/${id}`);
  return response.data;
};

export const registerToken = async (token: string) => {
  const response = await client.post('/notifications/register-token', { token });
  return response.data;
};
