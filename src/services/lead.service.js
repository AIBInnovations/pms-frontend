import api from './api';

const leadService = {
  async getAll(params = {}) {
    const { data } = await api.get('/leads', { params });
    return data;
  },
  async getById(id) {
    const { data } = await api.get(`/leads/${id}`);
    return data;
  },
  async checkDuplicate(email, company) {
    const { data } = await api.get('/leads/check-duplicate', { params: { email, company } });
    return data;
  },
  async create(leadData) {
    const { data } = await api.post('/leads', leadData);
    return data;
  },
  async update(id, leadData) {
    const { data } = await api.patch(`/leads/${id}`, leadData);
    return data;
  },
  async delete(id) {
    const { data } = await api.delete(`/leads/${id}`);
    return data;
  },
  async addNote(id, text) {
    const { data } = await api.post(`/leads/${id}/notes`, { text });
    return data;
  },
  async deleteNote(id, noteId) {
    const { data } = await api.delete(`/leads/${id}/notes/${noteId}`);
    return data;
  },
  async convertToProject(id, overrides = {}) {
    const { data } = await api.post(`/leads/${id}/convert-to-project`, overrides);
    return data;
  },
  async previewImport(file) {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post('/leads/import/preview', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  async commitImport(file) {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post('/leads/import', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export default leadService;
