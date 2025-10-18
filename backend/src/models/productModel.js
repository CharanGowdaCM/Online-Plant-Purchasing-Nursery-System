const supabase = require('../config/supabase');

class ProductModel {
  static async getProducts({ page, limit, category, search, sort, minPrice, maxPrice, careLevel }) {
    let query = supabase
      .from('product_catalog_view')
      .select('*', { count: 'exact' });

    // Apply filters
    if (category) {
      query = query.eq('category_slug', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,botanical_name.ilike.%${search}%`);
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
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      items: data,
      total: count
    };
  }

  static async getProductBySlug(slug) {
    // Get product details
    const { data: product, error } = await supabase
      .from('product_catalog_view')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    if (!product) return null;

    // Get product images
    const { data: images } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('display_order', { ascending: true });

    // Get product reviews
    const { data: reviews } = await supabase
      .from('product_reviews')
      .select(`
        id,
        rating,
        title,
        comment,
        created_at,
        is_verified_purchase,
        profiles:users(first_name, last_name)
      `)
      .eq('product_id', product.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    return {
      ...product,
      images: images || [],
      reviews: reviews || []
    };
  }

  static async getAllCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data;
  }
}

module.exports = ProductModel;