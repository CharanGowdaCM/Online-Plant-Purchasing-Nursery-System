const supabase = require('../config/supabase');

class ProductModel {
  static async getProducts({ page = 1, limit = 12, category, search, sort = 'newest', minPrice, maxPrice, careLevel }) {
    try {
      let query = supabase
        .from('product_catalog_view')
        .select('*', { count: 'exact' });

      // Apply filters
      if (category) {
        query = query.eq('category_slug', category);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,` +
          `description.ilike.%${search}%,` +
          `botanical_name.ilike.%${search}%`
        );
      }

      if (minPrice !== undefined) {
        query = query.gte('price', minPrice);
      }

      if (maxPrice !== undefined) {
        query = query.lte('price', maxPrice);
      }

      if (careLevel) {
        query = query.eq('care_level', careLevel);
      }

      // Apply sorting
      switch (sort) {
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          query = query.order('avg_rating', { ascending: false });
          break;
        case 'newest':
          query = query.order('id', { ascending: false });
          break;
        default:
          query = query.order('id', { ascending: false });
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + (limit - 1);
      query = query.range(from, to);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        console.error('Database query error:', error);
        throw error;
      }

      return {
        success: true,
        data: data || [],
        pagination: {
          total: count || 0,
          page: page,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error in getProducts:', error);
      throw error;
    }
  }

  static async getProductBySlug(slug) {
    try {
      const { data, error } = await supabase
        .from('product_catalog_view')
        .select(`
          *,
          product_images(*)
        `)
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching product by slug:', error);
        throw error;
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in getProductBySlug:', error);
      throw error;
    }
  }

  static async getAllCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, image_url')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      throw error;
    }
  }

  static async createProduct(payload) {
    try {
      const slug = payload.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...payload,
          slug,
          is_active: true
        }])
        .select();

      if (error) {
        console.error('Error creating product:', error);
        throw error;
      }

      return {
        success: true,
        data: data[0]
      };
    } catch (error) {
      console.error('Error in createProduct:', error);
      throw error;
    }
  }
}

module.exports = ProductModel;