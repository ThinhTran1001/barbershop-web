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
  }

}, { timestamps: true }); 
module.exports = mongoose.model('Barber', barberSchema);
