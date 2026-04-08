import api from './api';

const socialPostService = {
  async getAll(params) { return (await api.get('/social-posts', { params })).data; },
  async getById(id) { return (await api.get(`/social-posts/${id}`)).data; },
  async getCalendar(year, month) { return (await api.get('/social-posts/calendar', { params: { year, month } })).data; },
  async getStats() { return (await api.get('/social-posts/stats')).data; },
  async create(data) { return (await api.post('/social-posts', data)).data; },
  async update(id, data) { return (await api.patch(`/social-posts/${id}`, data)).data; },
  async delete(id) { return (await api.delete(`/social-posts/${id}`)).data; },
  async submit(id) { return (await api.post(`/social-posts/${id}/submit`)).data; },
  async approve(id) { return (await api.post(`/social-posts/${id}/approve`)).data; },
  async reject(id, reason) { return (await api.post(`/social-posts/${id}/reject`, { reason })).data; },
  async publish(id) { return (await api.post(`/social-posts/${id}/publish`)).data; },
  async archive(id) { return (await api.post(`/social-posts/${id}/archive`)).data; },
  async uploadMedia(file) {
    const fd = new FormData();
    fd.append('file', file);
    return (await api.post('/social-posts/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  },
};

export default socialPostService;
