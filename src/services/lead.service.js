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
};

export default leadService;
