const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use memory storage for all uploads so we can stream to Cloudinary
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

module.exports = {
  pyqUpload,
  resourceUpload,
  getFileTypeCategory
};
