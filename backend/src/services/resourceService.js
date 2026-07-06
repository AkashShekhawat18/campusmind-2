const multer = require('multer');
const path = require('path');
const fs = require('fs');

const supabase = require('../utils/supabase');

// Use memory storage for all uploads so we can stream to Supabase
const storage = multer.memoryStorage();

const pyqUpload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed for question papers'), false);
    }
  }
});

// Resource upload config (PDF, DOCX, PPT, Images)
// using same memory storage
const allowedResourceTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/msword', // doc
  'application/vnd.ms-powerpoint', // ppt
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain'
];

const resourceUpload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (allowedResourceTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`), false);
    }
  }
});

/**
 * Determine resource file type category from mimetype
 */
const getFileTypeCategory = (mimetype) => {
  if (mimetype === 'application/pdf') return 'PDF';
  if (mimetype.includes('word')) return 'DOCX';
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'PPT';
  if (mimetype.startsWith('image/')) return 'IMAGE';
  return 'NOTES';
};

/**
 * Upload a file buffer to Supabase Storage
 */
const uploadToSupabase = async (fileBuffer, originalName, bucket, mimeType) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filePath = `${uniqueSuffix}${path.extname(originalName)}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: false
    });
    
  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error('Failed to upload file to storage');
  }
  
  return data.path; // returns the path within the bucket
};

module.exports = {
  pyqUpload,
  resourceUpload,
  getFileTypeCategory,
  uploadToSupabase
};
