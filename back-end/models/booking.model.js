const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookingSchema = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    barberId: {
        type: Schema.Types.ObjectId,
        ref: 'Barber',
        required: true
    },
    serviceId: {
        type: Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    bookingDate: {
        type: Date,
        required: true
    },
    durationMinutes: {
        type: Number,
        required: true
    },
    note: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
        default: 'pending'
    },
    notificationMethods: [{
        type: String,
        enum: ['email', 'sms', 'push']
    }],
    autoAssignedBarber: {
        type: Boolean,
        default: false
    },
    customerName: {
        type: String,
        trim: true
    },
    customerEmail: {
        type: String,
        trim: true
    },
    customerPhone: {
        type: String,
        trim: true
    },
    // Audit fields for booking confirmation tracking
    confirmedAt: {
        type: Date,
        default: null
    },
    confirmedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

bookingSchema.index({ customerId: 1, bookingDate: -1 });
bookingSchema.index({ barberId: 1, bookingDate: 1 });
bookingSchema.index({ status: 1, bookingDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
