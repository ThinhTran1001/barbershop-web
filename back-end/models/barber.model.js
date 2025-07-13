const mongoose = require('mongoose');

const barberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' 
  },

  bio: {
    type: String,
    required: true
  },

  experienceYears: {
    type: Number,
    required: true
  },

  specialties: {
    type: [String],
    required: true
  },

  expertiseTags: {
    type: [String],
    default: []
    // Tags like: ["fade", "coloring", "beard", "long_hair", "curly_hair", "wedding_styles"]
  },

  hairTypeExpertise: {
    type: [String],
    default: []
    // Hair types: ["straight", "wavy", "curly", "coily"]
  },

  styleExpertise: {
    type: [String],
    default: []
    // Styles: ["short", "medium", "long", "beard", "mustache"]
  },

  averageRating: {
    type: Number,
    required: true,
    default: 0
  },

  ratingCount: {
    type: Number,
    required: true,
    default: 0
  },

  totalBookings: {
    type: Number,
    required: true,
    default: 0
  },

  isAvailable: {
    type: Boolean,
    required: true,
    default: true
  },

  workingSince: {
    type: Date,
    required: true
  },

  autoAssignmentEligible: {
    type: Boolean,
    default: true
  },

  maxDailyBookings: {
    type: Number,
    default: 12
  },

  preferredWorkingHours: {
    start: { type: String, default: "09:00" }, // "HH:MM" format
    end: { type: String, default: "18:00" }
  },

  profileImageUrl: String,

  certifications: [String],

  languages: {
    type: [String],
    default: ["Vietnamese"]
  }

}, { timestamps: true });

// Indexes for efficient filtering
barberSchema.index({ expertiseTags: 1, isAvailable: 1 });
barberSchema.index({ hairTypeExpertise: 1, styleExpertise: 1 });
barberSchema.index({ averageRating: -1, totalBookings: -1 });

module.exports = mongoose.model('Barber', barberSchema);
