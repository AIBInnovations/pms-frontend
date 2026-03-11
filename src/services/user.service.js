import api from './api';

const userService = {
  async getAll(params = {}) {
    const { data } = await api.get('/users', { params });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  async create(userData) {
    const { data } = await api.post('/users', userData);
    return data;
  },

  async update(id, userData) {
    const { data } = await api.patch(`/users/${id}`, userData);
    return data;
  },

  async updateRole(id, role) {
    const { data } = await api.patch(`/users/${id}/role`, { role });
    return data;
  },

  async updateStatus(id, status) {
    const { data } = await api.patch(`/users/${id}/status`, { status });
    return data;
  },

  async getProfile() {
    const { data } = await api.get('/users/profile');
    return data;
  },

  async updateProfile(profileData) {
    const { data } = await api.patch('/users/profile', profileData);
    return data;
  },

  async changePassword(currentPassword, newPassword) {
    const { data } = await api.patch('/users/change-password', { currentPassword, newPassword });
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },
};

export default userService;
