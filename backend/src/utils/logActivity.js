
const logActivity = async (supabase, userId, actionType, entityType, entityId, details = {}) => {
  console.log('Attempting to log activity:', {
    userId,
    actionType,
    entityType,
    entityId,
    details
  });

  if (!supabase) {
    console.error('Supabase client is not provided to logActivity');
    return;
  }

  try {
    const { data: tableCheck, error: tableError } = await supabase
      .from('activity_logs')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('Error checking activity_logs table:', tableError);
      return;
    }

    const { data, error } = await supabase
      .from('activity_logs')
      .insert([{
        user_id: userId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        details: details,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Error logging activity:', error);
      console.error('Failed insert payload:', {
        user_id: userId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        details: details
      });
    } else {
      console.log('Successfully logged activity:', data);
    }
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

module.exports = { logActivity };