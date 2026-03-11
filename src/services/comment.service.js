import api from './api';

const commentService = {
  async getByEntity(commentableType, commentableId, params = {}) {
    const { data } = await api.get('/comments', { params: { commentableType, commentableId, ...params } });
    return data;
  },

  async create(commentData) {
    const { data } = await api.post('/comments', commentData);
    return data;
  },

  async update(id, commentData) {
    const { data } = await api.patch(`/comments/${id}`, commentData);
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/comments/${id}`);
    return data;
  },

  async addReaction(id, emoji) {
    const { data } = await api.post(`/comments/${id}/reactions`, { emoji });
    return data;
  },

  async getReplies(id, params = {}) {
    const { data } = await api.get(`/comments/${id}/replies`, { params });
    return data;
  },
};

export default commentService;
