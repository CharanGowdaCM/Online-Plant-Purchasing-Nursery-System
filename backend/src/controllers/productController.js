const ProductModel = require('../models/productModel');

class ProductController {
  static async listProducts(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 12, 
        category, 
        search, 
        sort = 'newest',
        minPrice,
        maxPrice,
        careLevel
      } = req.query;

      const result = await ProductModel.getProducts({
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        search,
        sort,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        careLevel
      });

      // Check if headers have already been sent
      if (res.headersSent) return next();

      return res.json({
        success: true,
        data: result.data || [],
        pagination: {
          total: result.count || 0,
          page: parseInt(page),
          totalPages: Math.ceil((result.count || 0) / parseInt(limit))
        }
      });
    } catch (error) {
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Error fetching products',
          error: error.message
        });
      }
    }
  }

  static async getProductDetails(req, res) {
    try {
      const { slug } = req.params;
      const product = await ProductModel.getProductBySlug(slug);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      return res.json({
        success: true,
        data: product
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching product details',
        error: error.message
      });
    }
  }

  static async getCategories(req, res) {
    try {
      const categories = await ProductModel.getAllCategories();
      return res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching categories',
        error: error.message
      });
    }
  }
}

module.exports = ProductController;