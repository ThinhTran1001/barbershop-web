const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    categories: [{ type: String, default: 'General' }], // cho phép nhiều chuyên mục
    tags: [{ type: String }], // tags cho blog
    shortDesc: { type: String, maxlength: 300 },
    date: { type: Date, default: Date.now },
    content: { type: String, required: true },
    views: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);
