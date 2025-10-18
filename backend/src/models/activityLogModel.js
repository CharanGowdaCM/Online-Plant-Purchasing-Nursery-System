const supabase = require('../config/supabase');

class ActivityLogModel {
  static async logActivity(data) {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: data.userId,
        action_type: data.actionType,
        entity_type: data.entityType,
        entity_id: data.entityId,
        details: data.details,
        ip_address: data.ipAddress,
        user_agent: data.userAgent
      });

    if (error) throw error;
  }

  static async getLogs({ page, limit, type, userId }) {
    let query = supabase
      .from('activity_logs')
      .select(`
        *,
        users!activity_logs_user_id_fkey(
          email,
          role,
          profiles(first_name, last_name)
        )
      `, { count: 'exact' });

    if (type) {
      query = query.eq('action_type', type);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      items: data,
      total: count
    };
  }
}

module.exports = ActivityLogModel;