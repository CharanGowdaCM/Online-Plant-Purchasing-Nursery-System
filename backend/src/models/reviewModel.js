/*
 Review model - Handles product review data 
 Author: Charan Gowda C M
 Features: CRUD operations for product reviews
*/
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
        is_verified_purchase: true, 
        is_approved: false 
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

 
  static async getReviewsByProduct(productId) {
    const { data, error } = await supabase
  .from("product_reviews")
  .select(`
    id,
    rating,
    comment,
    users (
      email,
      profiles (
        first_name,
        last_name,
        avatar_url
      )
    )
  `)
  .eq("product_id", productId)
  .order("created_at", { ascending: false });

    
    console.log('Fetched reviews from DB for product', productId, data);

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
      products(name, slug)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}


}

module.exports = ReviewModel;
