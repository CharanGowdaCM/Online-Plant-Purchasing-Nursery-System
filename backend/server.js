require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createClient } = require('@supabase/supabase-js');

// Initialize activity logger
require('./src/listeners/activityLogger.js');

// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Make supabase client available in requests
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

(async () => {
  try {
    // Check if activity_logs table exists and create if it doesn't

    // Test database connection
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) {
      console.error(' Failed to connect to Supabase:', error.message);
    } else {
      console.log(' Database connected successfully ');
    }
  } catch (err) {
    console.error(' Database connection error:', err.message);
  }
})();


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Mount all routes from index.js
app.use('/api', require('./src/routes/index'));
//app.use('/api/users/support', require('./src/routes/supportMessageRoutes'));
// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'The requested resource does not exist'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;