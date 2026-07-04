const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const supabase = require('./supabase');

const BUCKETS = ['question-papers', 'resources', 'user-uploads'];/**
 * Ensures the campusmind-uploads bucket exists. If not, creates it as a public bucket.
 */
const ensureBucketsExist = async () => {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;
    
    for (const bucketName of BUCKETS) {
      const exists = buckets.find(b => b.name === bucketName);
      if (!exists) {
        console.log(`Creating Supabase bucket: ${bucketName}`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 52428800, // 50MB
        });
        if (createError) {
          if (createError.status === 400 || createError.statusCode === '403' || createError.statusCode === '400') {
             console.warn(`\n[WARNING] Could not auto-create Supabase bucket '${bucketName}' due to RLS policies.`);
             console.warn(`Make sure to add SUPABASE_SERVICE_ROLE_KEY to your .env file, OR manually create a public bucket named '${bucketName}' in your Supabase dashboard.\n`);
          } else {
             console.error(`Failed to create bucket ${bucketName}:`, createError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to ensure buckets exist:', error);
  }
};

/**
 * Uploads a local file to Supabase Storage and returns its public URL.
 * @param {string} localFilePath - Path to the local temp file.
 * @param {string} bucketName - Target bucket name.
 * @param {string} storagePath - Target path inside the bucket.
 * @param {string} mimeType - MIME type of the file.
 * @returns {Promise<string>} - Public URL of the uploaded file.
 */
const uploadFileToSupabase = async (localFilePath, originalName, bucketName, storagePath, mimeType) => {
  try {
    const fileBuffer = fs.readFileSync(localFilePath);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error(`Supabase upload error for ${originalName}:`, error);
    throw new Error('Failed to upload file to Supabase Storage');
  }
};

/**
 * Deletes a file from Supabase using its public URL.
 * @param {string} publicUrl - The public URL of the file stored in DB.
 */
const deleteFileFromSupabase = async (publicUrl) => {
  try {
    if (!publicUrl) return;

    // Find which bucket this URL belongs to
    const bucketMatch = BUCKETS.find(b => publicUrl.includes(`/public/${b}/`));
    if (!bucketMatch) return;

    // Extract path from the public URL
    const urlParts = publicUrl.split(`/public/${bucketMatch}/`);
    if (urlParts.length === 2) {
      const storagePath = urlParts[1];
      const { error } = await supabase.storage
        .from(bucketMatch)
        .remove([storagePath]);
      
      if (error) {
        console.error('Supabase deletion error:', error);
      } else {
        console.log(`Deleted from Supabase: ${storagePath} in bucket ${bucketMatch}`);
      }
    }
  } catch (error) {
    console.error('Error deleting file from Supabase:', error);
  }
};

module.exports = {
  ensureBucketsExist,
  uploadFileToSupabase,
  deleteFileFromSupabase,
  BUCKETS
};
