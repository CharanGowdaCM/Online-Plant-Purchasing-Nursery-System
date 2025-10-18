// src/config/supabaseClient.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { createClient } = require('@supabase/supabase-js');

// Add debugging to verify environment variables
console.log('Environment check:', {
  SUPABASE_URL_EXISTS: !!process.env.SUPABASE_URL,
  SUPABASE_KEY_EXISTS: !!process.env.SUPABASE_SERVICE_ROLE_KEY
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
module.exports = supabase;
