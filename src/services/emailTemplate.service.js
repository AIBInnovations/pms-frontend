import api from './api';

const emailTemplateService = {
  async getAll() {
    const { data } = await api.get('/email-templates');
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/email-templates', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.patch(`/email-templates/${id}`, payload);
    return data;
  },
  async delete(id) {
    const { data } = await api.delete(`/email-templates/${id}`);
    return data;
  },
};

export default emailTemplateService;
