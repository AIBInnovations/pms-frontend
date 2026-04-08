import api from './api';

const targetService = {
  async getAll(params) { return (await api.get('/targets', { params })).data; },
  async getCurrent() { return (await api.get('/targets/current')).data; },
  async getLeaderboard(periodKey) { return (await api.get('/targets/leaderboard', { params: { periodKey } })).data; },
  async getProgress(id) { return (await api.get(`/targets/${id}/progress`)).data; },
  async create(data) { return (await api.post('/targets', data)).data; },
  async update(id, data) { return (await api.patch(`/targets/${id}`, data)).data; },
  async delete(id) { return (await api.delete(`/targets/${id}`)).data; },
};

export default targetService;
