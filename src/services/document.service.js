import api from './api';

const documentService = {
  async getAll(params = {}) {
    const { data } = await api.get('/documents', { params });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/documents/${id}`);
    return data;
  },

  async create(docData) {
    const { data } = await api.post('/documents', docData);
    return data;
  },

  async update(id, docData) {
    const { data } = await api.patch(`/documents/${id}`, docData);
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/documents/${id}`);
    return data;
  },

  async getVersionHistory(id) {
    const { data } = await api.get(`/documents/${id}/versions`);
    return data;
  },

  async restoreVersion(id, versionNumber) {
    const { data } = await api.post(`/documents/${id}/versions/${versionNumber}/restore`);
    return data;
  },
};

export default documentService;
