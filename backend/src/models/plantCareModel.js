const supabase = require('../config/supabase');

class PlantCareModel {
  static async createGuide({
    title,
    slug,
    content,
    excerpt = null,
    plant_type = null,
    difficulty_level = 'beginner',
    featured_image_url = null,
    tags = [],
    is_published = false,
    published_at = null,
    author_id = null,
  }) {
    const payload = {
      title,
      slug,
      content,
      excerpt,
      plant_type,
      difficulty_level,
      featured_image_url,
      tags,
      is_published,
      published_at,
      author_id,
    };

    const { data, error } = await supabase
      .from('plant_care_guides')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getGuideById(id) {
    const { data, error } = await supabase
      .from('plant_care_guides')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async updateGuide(id, updates) {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('plant_care_guides')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async deleteGuide(id) {
    const { data, error } = await supabase
      .from('plant_care_guides')
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async listGuides({ page = 1, limit = 20, search, plant_type, difficulty_level, is_published }) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('plant_care_guides')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,slug.ilike.%${search}%,excerpt.ilike.%${search}%`
      );
    }
    if (plant_type) query = query.eq('plant_type', plant_type);
    if (difficulty_level) query = query.eq('difficulty_level', difficulty_level);
    if (typeof is_published === 'boolean') query = query.eq('is_published', is_published);

    const { data, error, count } = await query;
    if (error) throw error;
    return { guides: data || [], count: count || 0 };
  }
}

module.exports = PlantCareModel;
