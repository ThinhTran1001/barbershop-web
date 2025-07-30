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

// Static method to dynamically release slots when booking is completed early
barberScheduleSchema.statics.releaseCompletedBookingSlots = async function(barberId, date, bookingId, completionTime, session) {
    const query = { barberId, date };
    const schedule = session ?
        await this.findOne(query).session(session) :
        await this.findOne(query);

    if (!schedule) {
        return { success: false, message: 'Schedule not found' };
    }

    // Find all slots associated with this booking
    const bookingSlots = schedule.availableSlots.filter(slot =>
        slot.bookingId && slot.bookingId.toString() === bookingId.toString()
    );

    if (bookingSlots.length === 0) {
        return { success: false, message: 'No slots found for this booking' };
    }

    // Parse completion time
    const completionDate = new Date(completionTime);
    const completionTimeStr = `${completionDate.getHours().toString().padStart(2, '0')}:${completionDate.getMinutes().toString().padStart(2, '0')}`;

    // Calculate which slots should be released (from completion time onwards)
    let releasedSlots = [];
    let slotsToKeepBooked = [];

    for (const slot of bookingSlots) {
        const slotTime = slot.time;
        const [slotHour, slotMinute] = slotTime.split(':').map(Number);
        const [compHour, compMinute] = completionTimeStr.split(':').map(Number);

        const slotMinutes = slotHour * 60 + slotMinute;
        const compMinutes = compHour * 60 + compMinute;

        // Release slots that are at or after the completion time
        if (slotMinutes >= compMinutes) {
            const slotIndex = schedule.availableSlots.findIndex(s => s.time === slotTime && s.bookingId && s.bookingId.toString() === bookingId.toString());
            if (slotIndex !== -1) {
                schedule.availableSlots[slotIndex].isBooked = false;
                schedule.availableSlots[slotIndex].bookingId = null;
                releasedSlots.push(slotTime);
            }
        } else {
            slotsToKeepBooked.push(slotTime);
        }
    }

    if (releasedSlots.length > 0) {
        schedule.lastUpdated = new Date();

        if (session) {
            await schedule.save({ session });
        } else {
            await schedule.save();
        }
    }

    return {
        success: true,
        releasedSlots: releasedSlots,
        keptBookedSlots: slotsToKeepBooked,
        totalSlotsReleased: releasedSlots.length,
        completionTime: completionTimeStr,
        message: `Released ${releasedSlots.length} slots from ${completionTimeStr} onwards`
    };
};

// Static method to get real-time availability considering completed bookings
barberScheduleSchema.statics.getRealTimeAvailability = async function(barberId, date, fromTime = null) {
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

    // Get current bookings to check for early completions
    const Booking = require('./booking.model');
    const currentBookings = await Booking.find({
        barberId,
        bookingDate: {
            $gte: new Date(date + 'T00:00:00.000Z'),
            $lt: new Date(date + 'T23:59:59.999Z')
        },
        status: 'completed'
    });

    // Update schedule based on completed bookings
    for (const booking of currentBookings) {
        if (booking.completedAt) {
            await this.releaseCompletedBookingSlots(
                barberId,
                date,
                booking._id,
                booking.completedAt
            );
        }
    }

    // Refresh schedule after updates
    schedule = await this.findOne({ barberId, date });

    let availableSlots = schedule.availableSlots.filter(slot =>
        !slot.isBooked && !slot.isBlocked
    );

    // Filter by fromTime if specified
    if (fromTime) {
        const [fromHour, fromMinute] = fromTime.split(':').map(Number);
        const fromMinutes = fromHour * 60 + fromMinute;

        availableSlots = availableSlots.filter(slot => {
            const [slotHour, slotMinute] = slot.time.split(':').map(Number);
            const slotMinutes = slotHour * 60 + slotMinute;
            return slotMinutes >= fromMinutes;
        });
    }

    return {
        available: true,
        slots: availableSlots,
        lastUpdated: schedule.lastUpdated,
        realTimeSync: true
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
