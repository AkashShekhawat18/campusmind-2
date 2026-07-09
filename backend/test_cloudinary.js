require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  secure: true
});

console.log("Configured Cloud name:", cloudinary.config().cloud_name);

cloudinary.api.ping()
  .then(res => console.log("Ping success:", res))
  .catch(err => console.error("Ping error:", err));
