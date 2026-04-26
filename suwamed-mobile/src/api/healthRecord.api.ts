import client from './client';

export const getHealthRecords = async (params?: any) => {
    const response = await client.get('/health-records', { params });
    return response.data;
};
