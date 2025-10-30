// Developer: Charan Gowda C M
// Features: Product catalog, category management, product search, filtering, product update, admin and public routes, product retrieval


import api from './api';

// Public Product Routes
export const getAllProducts = async (params = {}) => {
  try {
    const response = await api.get('/products', { 
      params: {
        page: params.page || 1,
        limit: params.limit || 12,
        category: params.category || '',
        search: params.search || '',
        sort: params.sort || 'newest',
        careLevel: params.careLevel,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice
      }
    });

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Failed to fetch products');
    }

    return response.data;
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch products'
    };
  }
};

export const getProductBySlug = async (slug) => {
  try {
    const response = await api.get(`/products/${slug}`);
    console.log("Product By Slug Response:", response);
    return response.data;
  } catch (error) {
    console.error('Error in getProductBySlug:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch product details'
    };
  }
};

export const getProductById = async (id) => {
  try {
    // Use the new admin endpoint to fetch product by ID
    const response = await api.get(`/admin/inventory/products/${id}`);
    
    if (response.data?.success) {
      return {
        success: true,
        data: response.data.data
      };
    }
    
    throw new Error('Product not found');
  } catch (error) {
    console.error('Error in getProductById:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch product details'
    };
  }
};

export const getCategories = async () => {
  try {
    const response = await api.get('/products/categories');
    return response.data;
  } catch (error) {
    console.error('Error in getCategories:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch categories'
    };
  }
};

export const searchProducts = async (searchQuery, filters = {}) => {
  try {
    const response = await api.get('/products', {
      params: { 
        search: searchQuery,
        ...filters
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error in searchProducts:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to search products'
    };
  }
};

// Create the default export object
const productService = {
  getAllProducts,
  getProductBySlug,
  getProductById,
  getCategories,
  searchProducts
};

// Admin Product Routes
const adminProductService = {
  updateProduct: async (id, productData) => {
    try {
      const response = await api.put(`/admin/inventory/products/${id}`, productData);
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update product'
      };
    }
  },

  getAdminCategories: async () => {
    try {
      const response = await api.get('/admin/inventory/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin categories:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch categories'
      };
    }
  },

  addCategory: async (categoryData) => {
    try {
      const response = await api.post('/admin/inventory/categories', categoryData);
      return response.data;
    } catch (error) {
      console.error('Error adding category:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add category'
      };
    }
  },

  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.put(`/admin/inventory/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error updating category:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update category'
      };
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/admin/inventory/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting category:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete category'
      };
    }
  }
};

Object.assign(productService, adminProductService);

export default productService;


