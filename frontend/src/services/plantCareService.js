import api from './api';

const plantCareService = {
  getDashboard: async () => {
    const response = await api.get('/plant-care/dashboard');
    return response.data;
  },

  listPlants: async () => {
    const response = await api.get('/plant-care/plants');
    return response.data;
  },

  addPlant: async (payload) => {
    const response = await api.post('/plant-care/plants', payload);
    return response.data;
  },

  getPlantDetails: async (plantId) => {
    const response = await api.get(`/plant-care/plants/${plantId}`);
    return response.data;
  },

  updatePlant: async (plantId, payload) => {
    const response = await api.patch(`/plant-care/plants/${plantId}`, payload);
    return response.data;
  },

  completeTask: async (plantId, taskId) => {
    const response = await api.post(`/plant-care/plants/${plantId}/tasks/${taskId}/complete`);
    return response.data;
  },

  skipTask: async (plantId, taskId) => {
    const response = await api.post(`/plant-care/plants/${plantId}/tasks/${taskId}/skip`);
    return response.data;
  },

  refreshWeather: async (plantId, payload = {}) => {
    const response = await api.post(`/plant-care/plants/${plantId}/weather/refresh`, payload);
    return response.data;
  },

  generateSmartSchedule: async (plantId, params = {}) => {
    const response = await api.post(`/plant-care/plants/${plantId}/schedule/generate`, {}, { params });
    return response.data;
  },

  detectMissedTasks: async (plantId = null, params = {}) => {
    if (plantId) {
      const response = await api.post(`/plant-care/plants/${plantId}/missed/detect`, {}, { params });
      return response.data;
    }
    const response = await api.post('/plant-care/missed/detect', {}, { params });
    return response.data;
  },

  getNotifications: async (params = {}) => {
    const response = await api.get('/plant-care/notifications', { params });
    return response.data;
  },

  getCareHistory: async (params = {}) => {
    const response = await api.get('/plant-care/history', { params });
    return response.data;
  },

  diagnosePlant: async (plantId, payload) => {
    const response = await api.post(`/plant-care/plants/${plantId}/diagnose`, payload);
    return response.data;
  },

  markRecovered: async (plantId) => {
    const response = await api.post(`/plant-care/plants/${plantId}/recover`);
    return response.data;
  }
};

export default plantCareService;