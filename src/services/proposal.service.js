import api from './api';

const proposalService = {
  async getAll(params = {}) {
    const { data } = await api.get('/proposals', { params });
    return data;
  },
  async getById(id) {
    const { data } = await api.get(`/proposals/${id}`);
    return data;
  },
  async create(proposalData) {
    const { data } = await api.post('/proposals', proposalData);
    return data;
  },
  async update(id, proposalData) {
    const { data } = await api.patch(`/proposals/${id}`, proposalData);
    return data;
  },
  async updateStatus(id, status, rejectionReason) {
    const { data } = await api.patch(`/proposals/${id}/status`, { status, rejectionReason });
    return data;
  },
  async duplicate(id) {
    const { data } = await api.post(`/proposals/${id}/duplicate`);
    return data;
  },
  async delete(id) {
    const { data } = await api.delete(`/proposals/${id}`);
    return data;
  },
  async getTemplates() {
    const { data } = await api.get('/proposals/templates');
    return data;
  },
};

export default proposalService;
