const ProductModel = require('../models/productModel');

class ProductController {
  // Public endpoints
  static async listProducts(req, res) {
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

      const products = await ProductModel.getProducts({
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        search,
        sort,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        careLevel
      });

      res.json({
        success: true,
        data: products.items,
        pagination: {
          total: products.total,
          page: parseInt(page),
          totalPages: Math.ceil(products.total / limit)
        }
      });
    } catch (error) {
      console.error('Error in listProducts:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch products' 
      });
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

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error in getProductDetails:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch product details' 
      });
    }
  }

  static async getCategories(req, res) {
    try {
      const categories = await ProductModel.getAllCategories();
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error in getCategories:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch categories' 
      });
    }
  }
}

module.exports = ProductController;