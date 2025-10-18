const supabase = require('../config/supabase');

class BlogPostModel {
  static async createPost({
    title,
    slug,
    content,
    excerpt = null,
    featured_image_url = null,
    category = null,
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
      featured_image_url,
      category,
      tags,
      is_published,
      published_at,
      author_id,
    };

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getPostById(id) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async updatePost(id, updates) {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('blog_posts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async deletePost(id) {
    const { data, error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async listPosts({ page = 1, limit = 20, search, category, is_published }) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,slug.ilike.%${search}%,excerpt.ilike.%${search}%`
      );
    }
    if (category) query = query.eq('category', category);
    if (typeof is_published === 'boolean') query = query.eq('is_published', is_published);

    const { data, error, count } = await query;
    if (error) throw error;
    return { posts: data || [], count: count || 0 };
  }
}

module.exports = BlogPostModel;
