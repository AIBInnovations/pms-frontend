import api from './api';

const activityService = {
  async getGlobal(params = {}) {
    const { data } = await api.get('/activity', { params });
    return data;
  },
  async getByProject(projectId, params = {}) {
    const { data } = await api.get(`/activity/project/${projectId}`, { params });
    return data;
  },
};

export default activityService;
