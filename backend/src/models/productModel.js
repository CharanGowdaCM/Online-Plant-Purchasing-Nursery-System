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

  static async createProduct(payload) {
  try {
    const requiredFields = ['sku', 'name', 'category_id', 'price'];
    for (const field of requiredFields) {
      if (!payload[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const slug =
      payload.slug ||
      payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const insertPayload = {
      sku: payload.sku,
      name: payload.name,
      slug,
      description: payload.description || null,
      short_description: payload.short_description || null,
      category_id: payload.category_id,
      price: Number(payload.price),
      compare_at_price: payload.compare_at_price ? Number(payload.compare_at_price) : null,
      cost_price: payload.cost_price ? Number(payload.cost_price) : null,
      botanical_name: payload.botanical_name || null,
      plant_type: payload.plant_type || null,
      light_requirement: payload.light_requirement || null,
      water_requirement: payload.water_requirement || null,
      growth_rate: payload.growth_rate || null,
      mature_size: payload.mature_size || null,
      care_level: payload.care_level || null,
      pet_friendly: payload.pet_friendly || false,
      stock_quantity: Number(payload.stock_quantity) || 0,
      reserved_quantity: Number(payload.reserved_quantity) || 0,
      reorder_level: payload.reorder_level || null,
      max_order_quantity: payload.max_order_quantity || null,
      meta_title: payload.meta_title || null,
      meta_description: payload.meta_description || null,
      tags: Array.isArray(payload.tags)
        ? payload.tags
        : typeof payload.tags === 'string'
        ? payload.tags.split(',').map((t) => t.trim())
        : [],
      is_active: payload.is_active !== false,
      is_featured: payload.is_featured || false,
      min_stock_threshold: Number(payload.min_stock_threshold) || 5,
      max_stock_threshold: payload.max_stock_threshold ? Number(payload.max_stock_threshold) : null,
      reorder_quantity: payload.reorder_quantity ? Number(payload.reorder_quantity) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('products')
      .insert([insertPayload])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    throw new Error(err.message || 'Failed to create product');
  }
}

  static async getStats() {
    try {
      // Total products
      const { count: totalProducts, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      if (countError) throw countError;

      // Active products
      const { count: activeProducts, error: activeError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (activeError) throw activeError;

      // Featured products
      const { count: featuredProducts, error: featuredError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_featured', true);
      if (featuredError) throw featuredError;

      // Products low in stock
      const { count: lowStockProducts, error: lowStockError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lt('stock_quantity', 'min_stock_threshold');
      if (lowStockError) throw lowStockError;

      // Price aggregates
      const { data: priceStats, error: priceError } = await supabase
        .from('products')
        .select('price')
        .order('price', { ascending: true }); // will use JS for min/max/avg
      if (priceError) throw priceError;

      const prices = priceStats.map(p => Number(p.price));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.length ? prices.reduce((a,b) => a+b,0)/prices.length : 0;

      // Stock aggregates
      const { data: stockData, error: stockError } = await supabase
        .from('products')
        .select('stock_quantity');
      if (stockError) throw stockError;
      const totalStock = stockData.reduce((sum, p) => sum + p.stock_quantity, 0);

      return {
        totalProducts,
        activeProducts,
        featuredProducts,
        lowStockProducts,
        totalStock,
        minPrice,
        maxPrice,
        avgPrice: Number(avgPrice.toFixed(2))
      };
    } catch (err) {
      throw new Error(err.message || 'Failed to get product stats');
    }
  }

}

module.exports = ProductModel;