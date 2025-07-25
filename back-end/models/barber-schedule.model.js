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
    workingHours: {
        start: { type: String, default: "09:00" }, // "HH:MM" format
        end: { type: String, default: "18:00" }
    },
    availableSlots: [{
        time: { type: String, required: true }, // Format: "HH:MM"
        isBooked: { type: Boolean, default: false },
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
        isBlocked: { type: Boolean, default: false }, // Manually blocked by admin
        blockReason: String
    }],
    isOffDay: {
        type: Boolean,
        default: false
    },
    offReason: {
        type: String,
        enum: ['weekend', 'holiday', 'sick_leave', 'vacation', 'personal', 'other', 'absence']
    },
    absenceId: {
        type: Schema.Types.ObjectId,
        ref: 'BarberAbsence'
    },
    slotDuration: {
        type: Number,
        default: 30 // minutes per slot
    },
    breakTimes: [{
        start: String, // "HH:MM"
        end: String,   // "HH:MM"
        reason: String
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

barberScheduleSchema.index({ barberId: 1, date: 1 }, { unique: true });
barberScheduleSchema.index({ date: 1, 'availableSlots.isBooked': 1 });

// Method to generate default time slots
barberScheduleSchema.methods.generateDefaultSlots = function() {
    const slots = [];
    const startTime = this.workingHours.start.split(':');
    const endTime = this.workingHours.end.split(':');

    let currentHour = parseInt(startTime[0]);
    let currentMinute = parseInt(startTime[1]);
    const endHour = parseInt(endTime[0]);
    const endMinute = parseInt(endTime[1]);

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        // Check if this time conflicts with break times
        const isBreakTime = this.breakTimes.some(breakTime => {
            const breakStart = breakTime.start.split(':');
            const breakEnd = breakTime.end.split(':');
            const breakStartMinutes = parseInt(breakStart[0]) * 60 + parseInt(breakStart[1]);
            const breakEndMinutes = parseInt(breakEnd[0]) * 60 + parseInt(breakEnd[1]);
            const currentMinutes = currentHour * 60 + currentMinute;

            return currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes;
        });

        if (!isBreakTime) {
            slots.push({
                time: timeStr,
                isBooked: false,
                isBlocked: false
            });
        }

        currentMinute += this.slotDuration;
        if (currentMinute >= 60) {
            currentHour += Math.floor(currentMinute / 60);
            currentMinute = currentMinute % 60;
        }
    }

    this.availableSlots = slots;
    return slots;
};

// Static method to get available slots for a barber on a specific date
barberScheduleSchema.statics.getAvailableSlots = async function(barberId, date) {
    let schedule = await this.findOne({ barberId, date });

    if (!schedule) {
        // Create default schedule for the date
        schedule = new this({
            barberId,
            date,
            workingHours: { start: "09:00", end: "18:00" }
        });
        schedule.generateDefaultSlots();
        await schedule.save();
    }

    if (schedule.isOffDay) {
        return { available: false, reason: schedule.offReason || 'Off day', slots: [] };
    }

    const availableSlots = schedule.availableSlots.filter(slot =>
        !slot.isBooked && !slot.isBlocked
    );

    return { available: true, slots: availableSlots };
};

// Static method to mark time slots as booked for a specific booking
barberScheduleSchema.statics.markSlotsAsBooked = async function(barberId, date, startTime, durationMinutes, bookingId, session) {
    const query = { barberId, date };
    let schedule = session ?
        await this.findOne(query).session(session) :
        await this.findOne(query);

    if (!schedule) {
        // Create default schedule if it doesn't exist
        schedule = new this({
            barberId,
            date,
            workingHours: { start: "09:00", end: "18:00" }
        });
        schedule.generateDefaultSlots();

        if (session) {
            await schedule.save({ session });
        } else {
            await schedule.save();
        }
    }

    // Calculate which slots need to be marked as booked
    const slotsToBook = calculateSlotsForDuration(startTime, durationMinutes, schedule.slotDuration);

    let bookedSlots = [];
    let conflictFound = false;

    // Check for conflicts and mark slots as booked
    for (const slotTime of slotsToBook) {
        const slotIndex = schedule.availableSlots.findIndex(slot => slot.time === slotTime);

        if (slotIndex === -1) {
            throw new Error(`Time slot ${slotTime} not found in schedule`);
        }

        const slot = schedule.availableSlots[slotIndex];

        // Check if slot is already booked or blocked
        if (slot.isBooked || slot.isBlocked) {
            conflictFound = true;
            break;
        }

        // Mark slot as booked
        schedule.availableSlots[slotIndex].isBooked = true;
        schedule.availableSlots[slotIndex].bookingId = bookingId;
        bookedSlots.push(slotTime);
    }

    if (conflictFound) {
        throw new Error('One or more time slots are already booked or blocked');
    }

    // Update last modified timestamp
    schedule.lastUpdated = new Date();

    if (session) {
        await schedule.save({ session });
    } else {
        await schedule.save();
    }

    return {
        success: true,
        bookedSlots: bookedSlots,
        totalSlotsBooked: bookedSlots.length
    };
};

// Static method to unmark time slots (for booking cancellation)
barberScheduleSchema.statics.unmarkSlotsAsBooked = async function(barberId, date, bookingId, session) {
    const query = { barberId, date };
    const schedule = session ?
        await this.findOne(query).session(session) :
        await this.findOne(query);

    if (!schedule) {
        return { success: false, message: 'Schedule not found' };
    }

    let unbookedSlots = [];

    // Find and unmark slots associated with this booking
    for (let i = 0; i < schedule.availableSlots.length; i++) {
        const slot = schedule.availableSlots[i];
        if (slot.bookingId && slot.bookingId.toString() === bookingId.toString()) {
            schedule.availableSlots[i].isBooked = false;
            schedule.availableSlots[i].bookingId = null;
            unbookedSlots.push(slot.time);
        }
    }

    if (unbookedSlots.length > 0) {
        schedule.lastUpdated = new Date();

        if (session) {
            await schedule.save({ session });
        } else {
            await schedule.save();
        }
    }

    return {
        success: true,
        unbookedSlots: unbookedSlots,
        totalSlotsUnbooked: unbookedSlots.length
    };
};

// Helper function to calculate which time slots are needed for a service duration
function calculateSlotsForDuration(startTime, durationMinutes, slotDuration = 30) {
    const slots = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;
    let remainingDuration = durationMinutes;

    while (remainingDuration > 0) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        slots.push(timeStr);

        // Move to next slot
        currentMinute += slotDuration;
        if (currentMinute >= 60) {
            currentHour += Math.floor(currentMinute / 60);
            currentMinute = currentMinute % 60;
        }

        remainingDuration -= slotDuration;
    }

    return slots;
}

const BarberSchedule = mongoose.model('BarberSchedule', barberScheduleSchema);
module.exports = BarberSchedule;
