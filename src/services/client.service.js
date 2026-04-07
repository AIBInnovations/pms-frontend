import api from './api';

const clientService = {
  async getAll(params = {}) {
    const { data } = await api.get('/clients', { params });
    return data;
  },
  async getById(id) {
    const { data } = await api.get(`/clients/${id}`);
    return data;
  },
  async create(clientData) {
    const { data } = await api.post('/clients', clientData);
    return data;
  },
  async update(id, clientData) {
    const { data } = await api.patch(`/clients/${id}`, clientData);
    return data;
  },
  async delete(id) {
    const { data } = await api.delete(`/clients/${id}`);
    return data;
  },
  async addNote(id, text) {
    const { data } = await api.post(`/clients/${id}/notes`, { text });
    return data;
  },
  async deleteNote(id, noteId) {
    const { data } = await api.delete(`/clients/${id}/notes/${noteId}`);
    return data;
  },
};

export default clientService;
