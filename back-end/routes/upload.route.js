const express    = require('express');
const multer     = require('multer');
const streamifier= require('streamifier');
const cloudinary = require('../config/cloudinary.js');

const router = express.Router();
const upload = multer();  

function uploadStream(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'WDP391' },
      (err, result) => err ? reject(err) : resolve(result)
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const result = await uploadStream(req.file.buffer);
    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload lên Cloudinary thất bại' });
  }
});

module.exports = router;
