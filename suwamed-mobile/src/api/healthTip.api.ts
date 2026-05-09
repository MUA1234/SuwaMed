import client from './client';

export const getHealthTips = async (params?: any) => {
    const response = await client.get('/health-tips', { params });
    return response.data;
};

export const getAllHealthTipsAdmin = async () => {
    const response = await client.get('/health-tips/admin/all');
    return response.data;
};

export const createHealthTip = async (data: any) => {
    const response = await client.post('/health-tips', data);
    return response.data;
};

export const updateHealthTip = async (id: string, data: any) => {
    const response = await client.put(`/health-tips/${id}`, data);
    return response.data;
};

export const deleteHealthTip = async (id: string) => {
    const response = await client.delete(`/health-tips/${id}`);
    return response.data;
};

export const incrementHealthTipView = async (id: string) => {
    const response = await client.patch(`/health-tips/${id}/view`);
    return response.data;
};
