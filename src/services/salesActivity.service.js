import api from './api';

const salesActivityService = {
  async getByLead(leadId) {
    const { data } = await api.get(`/leads/${leadId}/activities`);
    return data;
  },
  async create(leadId, activityData) {
    const { data } = await api.post(`/leads/${leadId}/activities`, activityData);
    return data;
  },
  async update(id, activityData) {
    const { data } = await api.patch(`/activities/${id}`, activityData);
    return data;
  },
  async delete(id) {
    const { data } = await api.delete(`/activities/${id}`);
    return data;
  },
  async getUpcoming() {
    const { data } = await api.get('/activities/upcoming');
    return data;
  },
  async getOverdue() {
    const { data } = await api.get('/activities/overdue');
    return data;
  },
};

export default salesActivityService;
