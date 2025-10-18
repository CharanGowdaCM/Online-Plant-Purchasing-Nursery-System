require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const sqlPath = path.join(__dirname, '../db/init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  const client = new Client({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Add this to debug connection details
  console.log('Attempting to connect with:', {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    database: process.env.PG_DATABASE
  });

  try {
    await client.connect();
    console.log('Connected to Supabase DB. Running SQL...');
    await client.query(sql);
    console.log('SQL executed successfully.');
  } catch (err) {
    console.error('Database error:', err);
    throw err;
  } finally {
    await client.end();
  }
}

run().catch(err => {
  console.error('Failed to run SQL:', err);
  process.exit(1);
});