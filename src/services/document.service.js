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

  async uploadFile(file, projectId, category, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project', projectId);
    formData.append('title', file.name);
    if (category) formData.append('category', category);
    const { data } = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress ? (e) => onProgress(Math.round((e.loaded * 100) / e.total)) : undefined,
    });
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
