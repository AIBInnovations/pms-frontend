import api from './api';

const attendanceService = {
  async checkIn(data = {}) {
    const res = await api.post('/attendance/check-in', data);
    return res.data;
  },
  async checkOut(data = {}) {
    const res = await api.post('/attendance/check-out', data);
    return res.data;
  },
  async getToday() {
    const res = await api.get('/attendance/today');
    return res.data;
  },
  async getAll(params = {}) {
    const res = await api.get('/attendance', { params });
    return res.data;
  },
  async getSummary(params = {}) {
    const res = await api.get('/attendance/summary', { params });
    return res.data;
  },
  async getTodayAll() {
    const res = await api.get('/attendance/today-all');
    return res.data;
  },
  async getAllUsersSummary(params = {}) {
    const res = await api.get('/attendance/all-users-summary', { params });
    return res.data;
  },
  async registerIp(userId, ip) {
    const res = await api.post('/attendance/register-ip', { userId, ip });
    return res.data;
  },
  async removeIp(userId, ip) {
    const res = await api.delete(`/attendance/ip/${userId}/${encodeURIComponent(ip)}`);
    return res.data;
  },
};

export default attendanceService;
