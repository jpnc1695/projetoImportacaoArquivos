// config.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const config = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY
};

module.exports = {config};