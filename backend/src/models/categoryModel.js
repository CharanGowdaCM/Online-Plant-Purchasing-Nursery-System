const supabase = require('../config/supabase');

class CategoryModel {
  static async addCategory({ name, slug, description, parent_id = null, image_url = null, display_order = 0 }) {
    const payload = {
      name,
      slug,
      description,
      parent_id,
      image_url,
      display_order,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('categories')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAllCategories({ includeInactive = false } = {}) {
    let query = supabase.from('categories').select('*').order('display_order', { ascending: true });
    if (!includeInactive) query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async updateCategory(id, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = CategoryModel;
