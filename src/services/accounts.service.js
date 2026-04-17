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
  async settleWithdrawal(id, amount) { return (await api.post(`/accounts/withdrawals/${id}/settle`, amount != null ? { amount } : {})).data; },
  async unsettleWithdrawal(id) { return (await api.post(`/accounts/withdrawals/${id}/unsettle`)).data; },
  async getRecurringPlans() { return (await api.get('/accounts/recurring')).data; },
  async addRecurringPlan(data) { return (await api.post('/accounts/recurring', data)).data; },
  async updateRecurringPlan(id, data) { return (await api.patch(`/accounts/recurring/${id}`, data)).data; },
  async deleteRecurringPlan(id) { return (await api.delete(`/accounts/recurring/${id}`)).data; },

  async getInvoices(params) { return (await api.get('/accounts/invoices', { params })).data; },
  async generateInvoice(data) { return (await api.post('/accounts/invoices', data)).data; },
  async updateInvoice(id, data) { return (await api.patch(`/accounts/invoices/${id}`, data)).data; },
  async markInvoicePaid(id, data) { return (await api.post(`/accounts/invoices/${id}/pay`, data)).data; },
  async deleteInvoice(id) { return (await api.delete(`/accounts/invoices/${id}`)).data; },
};

export default accountsService;
