const mongoose = require('mongoose');
const { Schema } = mongoose;

const noShowSchema = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bookingId: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        unique: true
    },
    markedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

noShowSchema.index({ customerId: 1, createdAt: -1 });

const NoShow = mongoose.model('NoShow', noShowSchema);

module.exports = NoShow;