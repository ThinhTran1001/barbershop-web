// models/feedbackBooking.model.js
const mongoose = require('mongoose');

const feedbackBookingSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

feedbackBookingSchema.index({ bookingId: 1, userId: 1 }); 

const FeedbackBooking = mongoose.model('FeedbackBooking', feedbackBookingSchema);
module.exports = FeedbackBooking;