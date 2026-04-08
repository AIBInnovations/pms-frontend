import portalApi from './portalApi';
import api from './api';

const portalService = {
  // Public — client login
  async login(clientId, token) { return (await portalApi.post('/portal/auth/login', { clientId, token })).data; },

  // Portal-authenticated
  async getMe() { return (await portalApi.get('/portal/me')).data; },
  async getProjects() { return (await portalApi.get('/portal/projects')).data; },
  async getProposals() { return (await portalApi.get('/portal/proposals')).data; },
  async getInvoices() { return (await portalApi.get('/portal/invoices')).data; },

  // Admin (uses main api)
  async enableAccess(clientMongoId) { return (await api.post(`/portal/clients/${clientMongoId}/enable`)).data; },
  async disableAccess(clientMongoId) { return (await api.post(`/portal/clients/${clientMongoId}/disable`)).data; },
};

export default portalService;
