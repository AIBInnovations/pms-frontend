import api from './api';

const reportService = {
  async projectProgress(params = {}) {
    const { data } = await api.get('/reports/project-progress', { params });
    return data;
  },
  async bugSummary(params = {}) {
    const { data } = await api.get('/reports/bug-summary', { params });
    return data;
  },
  async developerAnalytics(params = {}) {
    const { data } = await api.get('/reports/developer-analytics', { params });
    return data;
  },
  async exportCSV(type, params = {}) {
    const response = await api.get(`/reports/export/${type}`, { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};

export default reportService;
