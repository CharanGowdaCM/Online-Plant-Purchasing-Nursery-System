const generateTrackingId = (orderId) => {
  const timestamp = Date.now().toString().slice(-6);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRK${timestamp}${randomStr}`;
};

module.exports = { generateTrackingId };