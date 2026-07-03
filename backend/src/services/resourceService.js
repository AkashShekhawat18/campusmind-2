const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = ['uploads/pyq', 'uploads/resources'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// PYQ upload config (PDFs only)
const pyqStorage = multer.memoryStorage();

const pyqUpload = multer({
  storage: pyqStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf') {
      return cb(null, true);
    }
    cb(new Error('Only PDF files are allowed for Question Papers'));
  }
});

// ─── General Resource Upload Config ──────────────────────────────

const resourceStorage = multer.memoryStorage();

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
  storage: resourceStorage,
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
