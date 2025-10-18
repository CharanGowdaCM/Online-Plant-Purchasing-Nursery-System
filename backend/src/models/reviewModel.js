// models/reviewModel.js
const supabase = require('../config/supabase');

class ReviewModel {
  
  static async addReview(userId, productId, orderId, rating, title, comment) {
    const { data, error } = await supabase
      .from('product_reviews')
      .insert([{
        user_id: userId,
        product_id: productId,
        order_id: orderId,
        rating,
        title: title || null,
        comment: comment || null,
        is_verified_purchase: true, // only users who purchased can add review
        is_approved: false // admin approval required
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

 
  static async getReviewsByProduct(productId) {
    const { data, error } = await supabase
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
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  
  static async hasUserReviewed(userId, productId, orderId) {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('order_id', orderId)
      .single();

    if (error) return false;
    return !!data;
  }

static async getReviewsByUser(userId) {
  const { data, error } = await supabase
    .from('product_reviews')
    .select(`
      id,
      product_id,
      rating,
      title,
      comment,
      created_at,
      is_approved,
      products(name, slug, image_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}


}

module.exports = ReviewModel;
