import api from './api';

const accountsService = {
  async getSummary(month) { return (await api.get('/accounts/summary', { params: month ? { month } : {} })).data; },
  async getReceivables() { return (await api.get('/accounts/receivables')).data; },

  async getPayments(params) { return (await api.get('/accounts/payments', { params })).data; },
  async addPayment(data) { return (await api.post('/accounts/payments', data)).data; },
  async updatePayment(id, data) { return (await api.patch(`/accounts/payments/${id}`, data)).data; },
  async deletePayment(id) { return (await api.delete(`/accounts/payments/${id}`)).data; },

  async getExpenses(params) { return (await api.get('/accounts/expenses', { params })).data; },
  async addExpense(data) { return (await api.post('/accounts/expenses', data)).data; },
  async updateExpense(id, data) { return (await api.patch(`/accounts/expenses/${id}`, data)).data; },
  async deleteExpense(id) { return (await api.delete(`/accounts/expenses/${id}`)).data; },

  async getWithdrawals(params) { return (await api.get('/accounts/withdrawals', { params })).data; },
  async addWithdrawal(data) { return (await api.post('/accounts/withdrawals', data)).data; },
  async updateWithdrawal(id, data) { return (await api.patch(`/accounts/withdrawals/${id}`, data)).data; },
  async deleteWithdrawal(id) { return (await api.delete(`/accounts/withdrawals/${id}`)).data; },
};

export default accountsService;
