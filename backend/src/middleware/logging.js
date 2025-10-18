// middleware/logging.js

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? "\x1b[31m" : "\x1b[32m";
    const resetColor = "\x1b[0m";
    
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${statusColor}${res.statusCode}${resetColor} - ${duration}ms`
    );
  });
  
  next();
};

// Activity logger for database
const logActivity = async (supabase, userId, actionType, entityType, entityId, details = {}) => {
  try {
    await supabase.from("activity_logs").insert([
      {
        user_id: userId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        details: details,
      },
    ]);
  } catch (err) {
    console.error("Error logging activity:", err.message);
  }
};

module.exports = { requestLogger, logActivity };