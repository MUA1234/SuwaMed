import client from './client';

export const getProfile = async () => {
  const response = await client.get('/patients/profile');
  return response.data;
};

export const updateProfile = async (data: any) => {
  const response = await client.put('/patients/profile', data);
  return response.data;
};

export const uploadAvatar = async (formData: FormData) => {
  const response = await client.post('/patients/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    transformRequest: (data) => data,
  });
  return response.data;
};
