const mongoose = require('mongoose');
const { Schema } = mongoose;

const barberScheduleSchema = new Schema({
    barberId: {
        type: Schema.Types.ObjectId,
        ref: 'Barber',
        required: true
    },
    date: {
        type: String, // Format: "YYYY-MM-DD"
        required: true
    },
    availableSlots: [{
        type: String, // Format: "HH:MM"
        required: true
    }],
    isOffDay: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

barberScheduleSchema.index({ barberId: 1, date: 1 }, { unique: true });

const BarberSchedule = mongoose.model('BarberSchedule', barberScheduleSchema);
module.exports = BarberSchedule;
