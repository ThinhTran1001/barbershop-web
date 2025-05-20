const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  description: { type: String },
  details: {
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    volume: { type: String },
    ingredients: { type: String },
    usage: { type: String },
    benefits: [{ type: String }]
  },
  rating: { type: Number },
  reviews: { type: Number },
  stock: { type: Number, required: true },
  discount: { type: Number },
  featured: { type: Boolean },
  categorieId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  longDescription: { type: String },
  howToUse: { type: String },
  additionalImages: [{ type: String }],
  origin: { type: String }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;