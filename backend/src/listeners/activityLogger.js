const activityEvents = require('../events/activityEvents');
const { logActivity } = require('../utils/logActivity');

activityEvents.on('log', async ({ supabase, userId, actionType, entityType, entityId, details }) => {
  console.log('Activity logger received event:', {
    userId,
    actionType,
    entityType,
    entityId,
    details
  });

  try {
    await logActivity(supabase, userId, actionType, entityType, entityId, details);
  } catch (error) {
    console.error('Activity logging failed:', error);
    console.error('Error details:', error.stack);
  }
});

console.log('Activity logger initialized');