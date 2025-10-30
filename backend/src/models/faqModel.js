/*
 FAQs Model(Customer Support) - Handles FAQs operations
 Author: Akhilesh K
 Features: Create, Read, Update, Delete, List FAQs and Categories
*/

const supabase = require('../config/supabase.js');

class FAQModel {
  static async createFAQ({ category, question, answer, display_order = 0, is_active = true }) {
    const payload = {
      category: category.trim(),
      question: question.trim(),
      answer: answer.trim(),
      display_order,
      is_active
    };

    const { data, error } = await supabase
      .from('faqs')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  
  static async getFAQById(faqId) {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('id', faqId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateFAQ(faqId, updates) {
    const payload = { 
      ...updates, 
      updated_at: new Date().toISOString() 
    };

    const { data, error } = await supabase
      .from('faqs')
      .update(payload)
      .eq('id', faqId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteFAQ(faqId, hardDelete = false) {
    if (hardDelete) {
      const { data, error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', faqId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      return await this.updateFAQ(faqId, { is_active: false });
    }
  }

  static async listFAQs({ 
    category = null, 
    is_active = null, 
    page = 1, 
    limit = 50, 
    search = null 
  } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('faqs')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (category) {
      query = query.eq('category', category);
    }

    if (is_active !== null) {
      query = query.eq('is_active', is_active);
    }

    if (search) {
      query = query.or(
        `question.ilike.%${search}%,answer.ilike.%${search}%,category.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { faqs: data || [], count: count || 0 };
  }

  static async getAllCategories(activeOnly = true) {
    let query = supabase
      .from('faqs')
      .select('category');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    const categories = [...new Set(data.map(faq => faq.category))];
    return categories.sort();
  }

  static async reorderFAQs(orderUpdates) {
    const promises = orderUpdates.map(({ id, display_order }) =>
      supabase
        .from('faqs')
        .update({ display_order, updated_at: new Date().toISOString() })
        .eq('id', id)
    );

    const results = await Promise.all(promises);
    const hasError = results.some(result => result.error);
    
    if (hasError) {
      const errors = results.filter(r => r.error).map(r => r.error);
      throw new Error(`Reorder failed: ${errors[0].message}`);
    }

    return true;
  }
}

module.exports = FAQModel;
