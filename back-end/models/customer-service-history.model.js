const mongoose = require('mongoose');
const { Schema } = mongoose;

const customerServiceHistorySchema = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    serviceId: {
        type: Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    bookingId: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    barberId: {
        type: Schema.Types.ObjectId,
        ref: 'Barber',
        required: true
    },
    completedAt: {
        type: Date,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    notes: {
        type: String,
        trim: true
    },
    customerSatisfaction: {
        type: String,
        enum: ['very_satisfied', 'satisfied', 'neutral', 'dissatisfied', 'very_dissatisfied']
    },
    recommendedServices: [{
        type: Schema.Types.ObjectId,
        ref: 'Service'
    }],
    hairTypeAtTime: String, // Customer's hair type when service was performed
    styleAchieved: String, // Style achieved after service
}, {
    timestamps: true
});

// Indexes for efficient querying
customerServiceHistorySchema.index({ customerId: 1, completedAt: -1 });
customerServiceHistorySchema.index({ serviceId: 1, rating: -1 });
customerServiceHistorySchema.index({ barberId: 1, completedAt: -1 });

// Static method to get customer's service preferences
customerServiceHistorySchema.statics.getCustomerPreferences = async function(customerId) {
    const history = await this.find({ customerId })
        .populate('serviceId')
        .sort({ completedAt: -1 })
        .limit(10);
    
    if (!history.length) return null;
    
    // Analyze preferences
    const serviceFrequency = {};
    const barberPreferences = {};
    const avgRatings = {};
    
    history.forEach(record => {
        const serviceId = record.serviceId._id.toString();
        const barberId = record.barberId.toString();
        
        serviceFrequency[serviceId] = (serviceFrequency[serviceId] || 0) + 1;
        barberPreferences[barberId] = (barberPreferences[barberId] || 0) + 1;
        
        if (record.rating) {
            if (!avgRatings[serviceId]) avgRatings[serviceId] = [];
            avgRatings[serviceId].push(record.rating);
        }
    });
    
    // Calculate average ratings
    Object.keys(avgRatings).forEach(serviceId => {
        const ratings = avgRatings[serviceId];
        avgRatings[serviceId] = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    });
    
    return {
        mostUsedServices: Object.entries(serviceFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5),
        preferredBarbers: Object.entries(barberPreferences)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3),
        serviceRatings: avgRatings,
        lastHairType: history[0]?.hairTypeAtTime,
        lastStyle: history[0]?.styleAchieved
    };
};

const CustomerServiceHistory = mongoose.model('CustomerServiceHistory', customerServiceHistorySchema);
module.exports = CustomerServiceHistory;
