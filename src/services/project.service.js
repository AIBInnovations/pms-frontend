import api from './api';

const projectService = {
  async getAll(params = {}) {
    const { data } = await api.get('/projects', { params });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },

  async create(projectData) {
    const { data } = await api.post('/projects', projectData);
    return data;
  },

  async update(id, projectData) {
    const { data } = await api.patch(`/projects/${id}`, projectData);
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/projects/${id}`);
    return data;
  },

  async getTeam(id) {
    const { data } = await api.get(`/projects/${id}/team`);
    return data;
  },

  // Milestones
  async getMilestones(projectId) {
    const { data } = await api.get(`/projects/${projectId}/milestones`);
    return data;
  },

  async createMilestone(projectId, milestoneData) {
    const { data } = await api.post(`/projects/${projectId}/milestones`, milestoneData);
    return data;
  },

  async updateMilestone(projectId, milestoneId, milestoneData) {
    const { data } = await api.patch(`/projects/${projectId}/milestones/${milestoneId}`, milestoneData);
    return data;
  },

  async deleteMilestone(projectId, milestoneId) {
    const { data } = await api.delete(`/projects/${projectId}/milestones/${milestoneId}`);
    return data;
  },
};

export default projectService;
