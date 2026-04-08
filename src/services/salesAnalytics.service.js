import api from './api';

const salesAnalyticsService = {
  async getOverview(params) { return (await api.get('/sales-analytics/overview', { params })).data; },
  async getFunnel(params) { return (await api.get('/sales-analytics/funnel', { params })).data; },
  async getRevenueTrend(params) { return (await api.get('/sales-analytics/revenue-trend', { params })).data; },
  async getWonLost(params) { return (await api.get('/sales-analytics/won-lost', { params })).data; },
  async getSources(params) { return (await api.get('/sales-analytics/sources', { params })).data; },
  async getPipelineBreakdown(params) { return (await api.get('/sales-analytics/pipeline-breakdown', { params })).data; },
};

export default salesAnalyticsService;
