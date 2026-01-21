import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // User endpoints
  async createOrGetUser(deviceId, username = 'Angler') {
    const response = await api.post('/user', { device_id: deviceId, username });
    return response.data;
  },

  async getUser(deviceId) {
    const response = await api.get(`/user/${deviceId}`);
    return response.data;
  },

  async unlockLure(userId, lureId) {
    const response = await api.post(`/user/${userId}/unlock-lure`, { user_id: userId, lure_id: lureId });
    return response.data;
  },

  async updateHighScore(userId, score) {
    const response = await api.post(`/user/${userId}/update-high-score?score=${score}`);
    return response.data;
  },

  async incrementCatches(userId, count = 1) {
    const response = await api.post(`/user/${userId}/increment-catches?count=${count}`);
    return response.data;
  },

  async setLevel(userId, level) {
    const response = await api.post(`/user/${userId}/set-level?level=${level}`);
    return response.data;
  },

  async prestigeUser(userId) {
    const response = await api.post(`/user/${userId}/prestige`);
    return response.data;
  },

  async unlockAchievement(userId, achievementId) {
    const response = await api.post(`/user/${userId}/unlock-achievement`, { achievement_id: achievementId });
    return response.data;
  },

  async completeDailyChallenge(userId) {
    const response = await api.post(`/user/${userId}/complete-daily`);
    return response.data;
  },

  // Score endpoints
  async submitScore(data) {
    const response = await api.post('/score', data);
    return response.data;
  },

  async getLeaderboard(limit = 100) {
    const response = await api.get(`/leaderboard?limit=${limit}`);
    return response.data;
  },

  // Weather endpoint
  async getWeather() {
    const response = await api.get('/weather');
    return response.data;
  },

  // Tacklebox endpoints
  async addFishToTacklebox(userId, fish) {
    const response = await api.post(`/tacklebox/${userId}/add-fish`, fish);
    return response.data;
  },

  async getTacklebox(userId, limit = 1000) {
    const response = await api.get(`/tacklebox/${userId}?limit=${limit}`);
    return response.data;
  },

  // Daily challenge
  async getDailyChallenge() {
    const response = await api.get('/daily-challenge');
    return response.data;
  },

  // Achievements
  async getAchievements() {
    const response = await api.get('/achievements');
    return response.data;
  },
};

export default apiService;
