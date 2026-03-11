import api from './api';

const bugService = {
  async getAll(params = {}) {
    const { data } = await api.get('/bugs', { params });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/bugs/${id}`);
    return data;
  },

  async create(bugData) {
    const { data } = await api.post('/bugs', bugData);
    return data;
  },

  async update(id, bugData) {
    const { data } = await api.patch(`/bugs/${id}`, bugData);
    return data;
  },

  async transition(id, status) {
    const { data } = await api.post(`/bugs/${id}/transition`, { status });
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/bugs/${id}`);
    return data;
  },

  async getByProject(projectId, params = {}) {
    const { data } = await api.get(`/bugs/project/${projectId}`, { params });
    return data;
  },

  async getStats(projectId) {
    const url = projectId ? `/bugs/project/${projectId}/stats` : '/bugs/stats';
    const { data } = await api.get(url);
    return data;
  },

  async getLinkedBugs(taskId) {
    const { data } = await api.get(`/bugs/task/${taskId}`);
    return data;
  },
};

export default bugService;
