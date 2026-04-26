import client from './client';

export const initiatePayment = async (data: any) => {
  const response = await client.post('/payments/initiate', data);
  return response.data;
};

export const verifyPayment = async (data: any) => {
  const response = await client.post('/payments/verify', data);
  return response.data;
};

export const getHistory = async () => {
  const response = await client.get('/payments/history');
  return response.data;
};

export const requestRefund = async (id: string) => {
  const response = await client.post(`/payments/refund/${id}`);
  return response.data;
};

export const requestWithdrawal = async (data: any) => {
  const response = await client.post('/payments/withdraw', data);
  return response.data;
};
