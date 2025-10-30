const activityEvents = require('../events/activityEvents');

const recordActivity = (req, action, entity, id, details = {}) => {
  console.log('recordActivity called with:', { action, entity, id, details });
  if (!req.user || !req.user.id) {
    console.warn('Cannot record activity: Missing user context', { user: req.user });
    return; 
  }

  if (!req.supabase) {
    console.warn('Cannot record activity: Missing Supabase instance');
    return; 
  }

  console.log('Emitting log event with:', {
    userId: req.user.id,
    actionType: action,
    entityType: entity,
    entityId: id
  });

  activityEvents.emit('log', {
    supabase: req.supabase,
    userId: req.user.id,
    actionType: action,
    entityType: entity,
    entityId: id,
    details,
  });
};

module.exports = { recordActivity };