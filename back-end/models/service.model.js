const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  steps: [String],
  suggestedFor: [String], // Existing field for general suggestions
  hairTypes: [String], // Compatible hair types: ["straight", "wavy", "curly", "coily"]
  styleCompatibility: [String], // Compatible styles: ["short", "medium", "long", "beard"]
  expertiseRequired: [String], // Required barber expertise tags
  price: { type: Number, required: true },
  durationMinutes: Number,
  isActive: { type: Boolean, default: true },
  category: {
    type: String,
    enum: ['cut', 'perm', 'color', 'combo', 'styling', 'treatment'],
    default: 'cut'
  },
  imageUrl: String, // Service image for display
  popularity: { type: Number, default: 0 }, // Track service popularity
}, {
  timestamps: true
});

// Tạo index cho các trường mảng riêng biệt
serviceSchema.index({ hairTypes: 1 });
serviceSchema.index({ styleCompatibility: 1 });

// Tạo index cho các thuộc tính khác
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1, popularity: -1 });

module.exports = mongoose.model("Service", serviceSchema);