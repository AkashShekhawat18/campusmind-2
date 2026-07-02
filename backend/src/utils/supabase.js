const { createClient } = require('@supabase/supabase-js');

// These should be configured in your .env file
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

// In the backend, we typically want to use the SERVICE ROLE key to bypass RLS for admin operations,
// but for standard auth we can use the anon key.
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
