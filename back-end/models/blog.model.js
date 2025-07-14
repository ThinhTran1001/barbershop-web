const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    category: { type: String, default: 'General' },
    shortDesc: { type: String, maxlength: 300 },
    date: { type: Date, default: Date.now },
    content: { type: String, required: true },
    views: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);
