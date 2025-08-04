const mongoose = require('mongoose');
const { Schema } = mongoose;

const barberAbsenceSchema = new Schema({
    barberId: {
        type: Schema.Types.ObjectId,
        ref: 'Barber',
        required: true
    },
    startDate: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                // Validate YYYY-MM-DD format
                return /^\d{4}-\d{2}-\d{2}$/.test(v);
            },
            message: 'Start date must be in YYYY-MM-DD format'
        }
    },
    endDate: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                // Validate YYYY-MM-DD format
                return /^\d{4}-\d{2}-\d{2}$/.test(v);
            },
            message: 'End date must be in YYYY-MM-DD format'
        }
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
        default: null // null = pending, true = approved, false = rejected
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
    console.log('🔍 isBarberAbsent called:', {
        barberId,
        date: date.toISOString(),
        dateLocal: date.toLocaleDateString()
    });

    // Convert input date to YYYY-MM-DD string for consistent comparison
    const checkDateStr = date.toISOString().split('T')[0];
    console.log('📅 Checking date string:', checkDateStr);

    // Find absences that cover this date (dates are now stored as strings)
    const absences = await this.find({
        barberId,
        isApproved: true
    });

    console.log('📋 All approved absences for barber:', absences.map(a => ({
        _id: a._id,
        startDate: a.startDate, // Now always string
        endDate: a.endDate       // Now always string
    })));

    // Check if any absence covers the check date (simple string comparison)
    const matchingAbsence = absences.find(absence => {
        const startDateStr = absence.startDate; // Already string
        const endDateStr = absence.endDate;     // Already string

        const isInRange = checkDateStr >= startDateStr && checkDateStr <= endDateStr;

        console.log(`📅 Checking absence ${absence._id}:`, {
            startDateStr,
            endDateStr,
            checkDateStr,
            isInRange
        });

        return isInRange;
    });

    console.log('📋 Matching absence:', matchingAbsence ? {
        _id: matchingAbsence._id,
        startDate: matchingAbsence.startDate,
        endDate: matchingAbsence.endDate
    } : 'None');

    return !!matchingAbsence;
};

// Static method to get all absences for a barber in a date range
barberAbsenceSchema.statics.getBarberAbsences = async function(barberId, startDate, endDate) {
    console.log('📅 getBarberAbsences called:', {
        barberId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
    });

    // Convert Date objects to YYYY-MM-DD strings for comparison
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log('📅 Converted to strings:', { startDateStr, endDateStr });

    // Since absence dates are now stored as strings, use string comparison
    const absences = await this.find({
        barberId,
        isApproved: true
    }).sort({ startDate: 1 });

    console.log('📋 All approved absences:', absences.map(a => ({
        _id: a._id,
        startDate: a.startDate,
        endDate: a.endDate
    })));

    // Filter absences that overlap with the date range
    const filteredAbsences = absences.filter(absence => {
        // Check if absence overlaps with the requested date range
        const absenceStart = absence.startDate;
        const absenceEnd = absence.endDate;

        const overlaps = (
            // Absence starts within range
            (absenceStart >= startDateStr && absenceStart <= endDateStr) ||
            // Absence ends within range
            (absenceEnd >= startDateStr && absenceEnd <= endDateStr) ||
            // Absence spans the entire range
            (absenceStart <= startDateStr && absenceEnd >= endDateStr)
        );

        console.log(`📅 Checking absence ${absence._id}:`, {
            absenceStart,
            absenceEnd,
            rangeStart: startDateStr,
            rangeEnd: endDateStr,
            overlaps
        });

        return overlaps;
    });

    console.log('📋 Filtered absences:', filteredAbsences.length);
    return filteredAbsences;
};

// Method to find affected bookings when creating absence
barberAbsenceSchema.methods.findAffectedBookings = async function() {
    const Booking = mongoose.model('Booking');

    // Convert string dates to Date objects for MongoDB query
    const startDate = new Date(this.startDate + 'T00:00:00');
    const endDate = new Date(this.endDate + 'T23:59:59');

    console.log('📅 Finding affected bookings:', {
        startDateStr: this.startDate,
        endDateStr: this.endDate,
        startDateObj: startDate.toISOString(),
        endDateObj: endDate.toISOString()
    });

    return await Booking.find({
        barberId: this.barberId,
        bookingDate: {
            $gte: startDate,
            $lte: endDate
        },
        status: { $in: ['pending', 'confirmed'] }
    }).populate('customerId serviceId');
};

// Instance method to update barber schedules when absence is approved
barberAbsenceSchema.methods.updateBarberSchedules = async function() {
    const BarberSchedule = require('./barber-schedule.model');

    console.log('🔧 updateBarberSchedules called for absence:', {
        absenceId: this._id,
        startDate: this.startDate,
        endDate: this.endDate,
        startDateType: typeof this.startDate,
        endDateType: typeof this.endDate
    });

    // Get all dates between startDate and endDate
    const dates = [];

    // Since dates are now stored as strings (YYYY-MM-DD), use them directly
    const startDateStr = this.startDate;
    const endDateStr = this.endDate;

    console.log('📅 Working with string dates:', {
        startDateStr,
        endDateStr,
        startDateType: typeof this.startDate,
        endDateType: typeof this.endDate
    });

    // Parse as local dates to avoid timezone issues
    const currentDate = new Date(startDateStr + 'T00:00:00');
    const endDate = new Date(endDateStr + 'T00:00:00');

    console.log('📅 Date objects for iteration:', {
        currentDate: currentDate.toISOString(),
        endDate: endDate.toISOString()
    });

    while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        dates.push(dateString);
        console.log(`📅 Adding date to absence: ${dateString}`);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('📅 Final dates array:', dates);

    // Update or create schedule records for each date
    const updatePromises = dates.map(async (date) => {
        console.log(`📅 Processing schedule for date: ${date}`);

        // Validate that date is within absence range
        if (date < this.startDate || date > this.endDate) {
            console.log(`⚠️ Skipping date ${date} - outside absence range ${this.startDate} to ${this.endDate}`);
            return;
        }

        let schedule = await BarberSchedule.findOne({
            barberId: this.barberId,
            date
        });

        if (!schedule) {
            // Create new schedule if it doesn't exist
            console.log(`📅 Creating new schedule for ${date}`);
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
            console.log(`📅 Updating existing schedule for ${date}`);
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
