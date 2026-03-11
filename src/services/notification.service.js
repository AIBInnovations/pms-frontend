import api from './api';

const notificationService = {
  async getAll(params = {}) {
    const { data } = await api.get('/notifications', { params });
    return data;
  },
  async getUnreadCount() {
    const { data } = await api.get('/notifications/unread-count');
    return data;
  },
  async markAsRead(ids) {
    const { data } = await api.patch('/notifications/read', { ids });
    return data;
  },
  async markAllRead() {
    const { data } = await api.patch('/notifications/read-all');
    return data;
  },
  async delete(id) {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },
};

export default notificationService;
