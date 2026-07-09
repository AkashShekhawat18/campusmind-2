const cloudinary = require('cloudinary').v2;

cloudinary.config({
  secure: true
  // It automatically picks up CLOUDINARY_URL from process.env
});

module.exports = cloudinary;
