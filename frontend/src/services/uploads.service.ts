import api from './api';

export const uploadsService = {
  async upload(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await api.post<{ url: string }>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async remove(url: string): Promise<void> {
    await api.delete('/uploads', { data: { url } });
  },
};

export default uploadsService;
