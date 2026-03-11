import api from './api';

const taskService = {
  async getAll(params = {}) {
    const { data } = await api.get('/tasks', { params });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/tasks/${id}`);
    return data;
  },

  async create(taskData) {
    const { data } = await api.post('/tasks', taskData);
    return data;
  },

  async update(id, taskData) {
    const { data } = await api.patch(`/tasks/${id}`, taskData);
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/tasks/${id}`);
    return data;
  },

  async transition(id, stage) {
    const { data } = await api.post(`/tasks/${id}/transition`, { stage });
    return data;
  },

  async getSubtasks(id) {
    const { data } = await api.get(`/tasks/${id}/subtasks`);
    return data;
  },

  async bulkAction(taskIds, action, value) {
    const { data } = await api.post('/tasks/bulk', { taskIds, action, value });
    return data;
  },

  async getByProject(projectId, params = {}) {
    const { data } = await api.get(`/tasks/project/${projectId}`, { params });
    return data;
  },

  async getStats(projectId) {
    const { data } = await api.get(`/tasks/project/${projectId}/stats`);
    return data;
  },

  async getWorkload(projectId) {
    const url = projectId ? `/tasks/workload/${projectId}` : '/tasks/workload';
    const { data } = await api.get(url);
    return data;
  },

  async uploadAttachment(taskId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async removeAttachment(taskId, attachmentId) {
    const { data } = await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    return data;
  },
};

export default taskService;
