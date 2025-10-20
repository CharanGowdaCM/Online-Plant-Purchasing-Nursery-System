import api from './api';

const contentService = {
  // Blog Posts
  createBlogPost: async (blogData) => {
    try {
      const response = await api.post('/admin/content/blog', blogData);
      return response.data;
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }
  },

  updateBlogPost: async (id, blogData) => {
    try {
      const response = await api.put(`/admin/content/blog/${id}`, blogData);
      return response.data;
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }
  },

  deleteBlogPost: async (id) => {
    try {
      const response = await api.delete(`/admin/content/blog/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw error;
    }
  },

  listBlogPosts: async (params = {}) => {
    try {
      const response = await api.get('/admin/content/blog', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      throw error;
    }
  },

  // Plant Care Guides
  createPlantGuide: async (guideData) => {
    try {
      const response = await api.post('/admin/content/plant-guides', guideData);
      return response.data;
    } catch (error) {
      console.error('Error creating plant guide:', error);
      throw error;
    }
  },

  updatePlantGuide: async (id, guideData) => {
    try {
      const response = await api.put(`/admin/content/plant-guides/${id}`, guideData);
      return response.data;
    } catch (error) {
      console.error('Error updating plant guide:', error);
      throw error;
    }
  },

  deletePlantGuide: async (id) => {
    try {
      const response = await api.delete(`/admin/content/plant-guides/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting plant guide:', error);
      throw error;
    }
  },

  listPlantGuides: async (params = {}) => {
    try {
      const response = await api.get('/admin/content/plant-guides', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching plant guides:', error);
      throw error;
    }
  },
};

export default contentService;