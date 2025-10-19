import api from './api';

const productService = {
  // Get all products
  getAllProducts: async (params = {}) => {
    try {
      const query = {
        page: params.page || 1,
        limit: params.limit || 12,
        category: params.category || '',
        search: params.search || '',
        sort: params.sort || 'newest'
      };

      // Handle care level
      if (params.careLevel && ['easy', 'moderate', 'difficult'].includes(params.careLevel)) {
        query.careLevel = params.careLevel;
      }

      // Handle price range with special case for '2000+'
      if (params.priceRange) {
        if (params.priceRange === '2000+') {
          query.minPrice = 2000;
        } else if (params.priceRange.includes('-')) {
          const [min, max] = params.priceRange.split('-').map(Number);
          if (!isNaN(min)) query.minPrice = min;
          if (!isNaN(max)) query.maxPrice = max;
        }
      }

      const response = await api.get('/products', { params: query });
      
      // Backend returns { success: true, data: [...], pagination: {...} }
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to fetch products');
      }

      const { data, pagination } = response.data;
      return {
        items: data,
        pagination,
        success: true
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // Search products
  searchProducts: async (searchQuery, filters = {}) => {
    try {
      const response = await api.get('/products/search', {
        params: { q: searchQuery, ...filters }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  // Get categories
  getCategories: async () => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
};

export default productService;