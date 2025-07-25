const mongoose = require('mongoose');
const { Schema } = mongoose;

const barberAbsenceSchema = new Schema({
    barberId: {
        type: Schema.Types.ObjectId,
        ref: 'Barber',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true,
        enum: ['sick_leave', 'vacation', 'emergency', 'training', 'personal', 'other']
    },
    description: {
        type: String,
        trim: true
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User' // Admin who approved
    },
    affectedBookings: [{
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: 'Booking'
        },
        originalDate: Date,
        newDate: Date,
        status: {
            type: String,
            enum: ['pending_reschedule', 'rescheduled', 'cancelled', 'reassigned'],
            default: 'pending_reschedule'
        },
        newBarberId: {
            type: Schema.Types.ObjectId,
            ref: 'Barber'
        }
    }],
    notificationsSent: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
barberAbsenceSchema.index({ barberId: 1, startDate: 1, endDate: 1 });
barberAbsenceSchema.index({ isApproved: 1, startDate: 1 });

// Validation: endDate must be after startDate
barberAbsenceSchema.pre('save', function(next) {
    if (this.endDate <= this.startDate) {
        next(new Error('End date must be after start date'));
    } else {
        next();
    }
});

// Static method to check if barber is absent on a specific date
barberAbsenceSchema.statics.isBarberAbsent = async function(barberId, date) {
    const absence = await this.findOne({
        barberId,
        isApproved: true,
        startDate: { $lte: date },
        endDate: { $gte: date }
    });
    return !!absence;
};

// Static method to get all absences for a barber in a date range
barberAbsenceSchema.statics.getBarberAbsences = async function(barberId, startDate, endDate) {
    return await this.find({
        barberId,
        isApproved: true,
        $or: [
            { startDate: { $gte: startDate, $lte: endDate } },
            { endDate: { $gte: startDate, $lte: endDate } },
            { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
        ]
    }).sort({ startDate: 1 });
};

// Method to find affected bookings when creating absence
barberAbsenceSchema.methods.findAffectedBookings = async function() {
    const Booking = mongoose.model('Booking');
    return await Booking.find({
        barberId: this.barberId,
        bookingDate: {
            $gte: this.startDate,
            $lte: this.endDate
        },
        status: { $in: ['pending', 'confirmed'] }
    }).populate('customerId serviceId');
};

// Instance method to update barber schedules when absence is approved
barberAbsenceSchema.methods.updateBarberSchedules = async function() {
    const BarberSchedule = require('./barber-schedule.model');

    // Get all dates between startDate and endDate
    const dates = [];
    const currentDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);

    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Update or create schedule records for each date
    const updatePromises = dates.map(async (date) => {
        let schedule = await BarberSchedule.findOne({
            barberId: this.barberId,
            date
        });

        if (!schedule) {
            // Create new schedule if it doesn't exist
            schedule = new BarberSchedule({
                barberId: this.barberId,
                date,
                workingHours: { start: "09:00", end: "18:00" },
                isOffDay: true,
                offReason: 'absence',
                absenceId: this._id
            });
            schedule.generateDefaultSlots();
        } else {
            // Update existing schedule
            schedule.isOffDay = true;
            schedule.offReason = 'absence';
            schedule.absenceId = this._id;
        }

        return await schedule.save();
    });

    return await Promise.all(updatePromises);
};

// Instance method to revert barber schedules when absence is rejected/cancelled
barberAbsenceSchema.methods.revertBarberSchedules = async function() {
    const BarberSchedule = require('./barber-schedule.model');

    // Get all dates between startDate and endDate
    const dates = [];
    const currentDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);

    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Revert schedule records for each date
    const updatePromises = dates.map(async (date) => {
        const schedule = await BarberSchedule.findOne({
            barberId: this.barberId,
            date,
            absenceId: this._id
        });

        if (schedule) {
            schedule.isOffDay = false;
            schedule.offReason = null;
            schedule.absenceId = null;
            return await schedule.save();
        }
    });

    return await Promise.all(updatePromises.filter(Boolean));
};

const BarberAbsence = mongoose.model('BarberAbsence', barberAbsenceSchema);
module.exports = BarberAbsence;
