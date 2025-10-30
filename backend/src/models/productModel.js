/*
 Product model - Handles product data 
 Author: Charan Gowda C M
 Features: CRUD operations for products, categories
*/

const supabase = require('../config/supabase');

class ProductModel {
  static async getProducts({ page = 1, limit = 12, category, search, sort = 'newest', minPrice, maxPrice, careLevel }) {
    try {
      let query = supabase
        .from('product_catalog_view')
        .select('*', { count: 'exact' });

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

      const from = (page - 1) * limit;
      const to = from + (limit - 1);
      query = query.range(from, to);

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

  static async getProductById(productId) {
    try {
      const id = String(productId);
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) {
        console.error('Error fetching product by ID:', productError);
        throw productError;
      }

      if (!product) {
        throw new Error('Product not found');
      }

      const { data: images, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id)
        .order('display_order', { ascending: true });

      if (imagesError) {
        console.error('Error fetching product images:', imagesError);
      }

      const productWithImages = {
        ...product,
        images: images || [],
        image_url: images && images.length > 0 ? images[0].image_url : null
      };

      return {
        success: true,
        data: productWithImages
      };
    } catch (error) {
      console.error('Error in getProductById:', error);
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

    const { images, ...productData } = payload;

    const { data: productDataResponse, error: productError } = await supabase
      .from('products')
      .insert([
        {
          ...productData,
          slug,
          is_active: true,
        },
      ])
      .select();

    if (productError) {
      console.error('Error inserting product:', productError);
      throw productError;
    }

    const newProduct = productDataResponse[0];

    if (images && Array.isArray(images) && images.length > 0) {
      const imageRecords = images.map((img, index) => ({
        product_id: newProduct.id,
        image_url: img.image_url || img, 
        alt_text: img.alt_text || newProduct.name,
        display_order: index,
        is_primary: index === 0,
      }));

      const { error: imageError } = await supabase
        .from('product_images')
        .insert(imageRecords);

      if (imageError) {
        console.error('Error inserting product images:', imageError);
        throw imageError;
      }
    }

    return {
      success: true,
      data: newProduct,
      message: 'Product created successfully',
    };
  } catch (error) {
    console.error('Error in createProduct:', error);
    throw error;
  }
}

  static async updateProduct(productId, payload) {
    try {
      const id = String(productId);
      
      const { data: existingProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingProduct) {
        console.error('Product fetch error:', fetchError);
        throw new Error('Product not found');
      }

      const { images, ...productData } = payload;
      console.log(productData);
      if (productData.name && productData.name !== existingProduct.name) {
        productData.slug = productData.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
      }

      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating product:', updateError);
        throw updateError;
      }

      if (images && Array.isArray(images)) {
        const { error: deleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', id);

        if (deleteError) {
          console.error('Error deleting old images:', deleteError);
          throw deleteError;
        }

        if (images.length > 0) {
          const imageRecords = images.map((img, index) => ({
            product_id: id,
            image_url: img.image_url || img,
            alt_text: img.alt_text || updatedProduct.name,
            display_order: index,
            is_primary: index === 0,
          }));

          const { error: imageError } = await supabase
            .from('product_images')
            .insert(imageRecords);

          if (imageError) {
            console.error('Error inserting updated images:', imageError);
            throw imageError;
          }
        }
      }

      return {
        success: true,
        data: updatedProduct,
        message: 'Product updated successfully',
      };
    } catch (error) {
      console.error('Error in updateProduct:', error);
      throw error;
    }
  }

static async getStats() {
    try {
      const { count: totalProducts, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      if (countError) throw countError;

      const { count: activeProducts, error: activeError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (activeError) throw activeError;

      const { count: featuredProducts, error: featuredError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_featured', true);
      if (featuredError) throw featuredError;

     const { data: products, error: lowStockError } = await supabase
        .from('products')
        .select('stock_quantity, min_stock_threshold');
       if (lowStockError) throw lowStockError;

      const lowStockProducts = products.filter(p => p.stock_quantity < p.min_stock_threshold).length;


      const { data: priceStats, error: priceError } = await supabase
        .from('products')
        .select('price')
        .order('price', { ascending: true }); 
      if (priceError) throw priceError;

      const prices = priceStats.map(p => Number(p.price));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.length ? prices.reduce((a,b) => a+b,0)/prices.length : 0;

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