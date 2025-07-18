const mongoose = require('mongoose');

const feedbackBarberSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Booking',
  },
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Barber',
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function (arr) {
        return arr.every(url => typeof url === 'string');
      },
      message: 'All images must be URLs in string format.',
    },
  },

  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FeedbackBarber', feedbackBarberSchema);