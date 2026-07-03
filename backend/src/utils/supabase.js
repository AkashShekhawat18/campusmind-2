const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials are missing. File uploads will fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const uploadFileToSupabase = async (fileBuffer, fileName, bucket, mimeType) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    throw error;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
    
  return { path: data.path, url: publicUrl };
};

module.exports = { supabase, uploadFileToSupabase };
