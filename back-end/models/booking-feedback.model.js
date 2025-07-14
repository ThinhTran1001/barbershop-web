const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookingFeedbackSchema = new Schema({
    bookingId: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        unique: true // One feedback per booking
    },
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
    
    // Overall rating (1-5 stars)
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    
    // Detailed ratings
    serviceQuality: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    barberProfessionalism: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    cleanliness: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    valueForMoney: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    wouldRecommend: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
    },
    
    // Text feedback
    comment: {
        type: String,
        required: true,
        trim: true,
        maxLength: 1000
    },
    
    // Images
    images: [{
        url: String,
        caption: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Feedback status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'hidden'],
        default: 'pending'
    },
    
    // Moderation
    moderatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    moderatedAt: Date,
    moderationNote: String,
    
    // Visibility
    isPublic: {
        type: Boolean,
        default: true
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    
    // Helpful votes
    helpfulVotes: {
        type: Number,
        default: 0
    },
    unhelpfulVotes: {
        type: Number,
        default: 0
    },
    
    // Response from business
    businessResponse: {
        message: String,
        respondedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: Date
    },
    
    // Metadata
    submittedAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    
    // Verification
    isVerified: {
        type: Boolean,
        default: true // Since it's linked to a booking
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
bookingFeedbackSchema.index({ barberId: 1, status: 1, createdAt: -1 });
bookingFeedbackSchema.index({ serviceId: 1, status: 1, rating: -1 });
bookingFeedbackSchema.index({ customerId: 1, createdAt: -1 });
bookingFeedbackSchema.index({ rating: -1, createdAt: -1 });
bookingFeedbackSchema.index({ status: 1, isPublic: 1 });

// Virtual for average detailed rating
bookingFeedbackSchema.virtual('averageDetailedRating').get(function() {
    const ratings = [
        this.serviceQuality,
        this.barberProfessionalism,
        this.cleanliness,
        this.valueForMoney
    ].filter(rating => rating != null);
    
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Static method to get barber's average rating
bookingFeedbackSchema.statics.getBarberAverageRating = async function(barberId) {
    const result = await this.aggregate([
        {
            $match: {
                barberId: new mongoose.Types.ObjectId(barberId),
                status: 'approved',
                isPublic: true
            }
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                averageServiceQuality: { $avg: '$serviceQuality' },
                averageBarberProfessionalism: { $avg: '$barberProfessionalism' },
                averageCleanliness: { $avg: '$cleanliness' },
                averageValueForMoney: { $avg: '$valueForMoney' },
                ratingDistribution: {
                    $push: '$rating'
                }
            }
        }
    ]);

    if (result.length === 0) {
        return {
            averageRating: 0,
            totalReviews: 0,
            averageServiceQuality: 0,
            averageBarberProfessionalism: 0,
            averageCleanliness: 0,
            averageValueForMoney: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
    }

    const stats = result[0];
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats.ratingDistribution.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
    });

    return {
        ...stats,
        ratingDistribution: distribution
    };
};

// Static method to get service's average rating
bookingFeedbackSchema.statics.getServiceAverageRating = async function(serviceId) {
    const result = await this.aggregate([
        {
            $match: {
                serviceId: new mongoose.Types.ObjectId(serviceId),
                status: 'approved',
                isPublic: true
            }
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                averageServiceQuality: { $avg: '$serviceQuality' }
            }
        }
    ]);

    return result.length > 0 ? result[0] : {
        averageRating: 0,
        totalReviews: 0,
        averageServiceQuality: 0
    };
};

// Method to check if feedback can be edited
bookingFeedbackSchema.methods.canBeEdited = function() {
    const daysSinceSubmission = (Date.now() - this.submittedAt) / (1000 * 60 * 60 * 24);
    return daysSinceSubmission <= 7 && this.status === 'pending'; // Can edit within 7 days if still pending
};

// Method to mark as helpful
bookingFeedbackSchema.methods.markAsHelpful = function(isHelpful = true) {
    if (isHelpful) {
        this.helpfulVotes += 1;
    } else {
        this.unhelpfulVotes += 1;
    }
    return this.save();
};

// Pre-save middleware to update barber's average rating
bookingFeedbackSchema.post('save', async function(doc) {
    if (doc.status === 'approved') {
        try {
            const Barber = mongoose.model('Barber');
            const stats = await mongoose.model('BookingFeedback').getBarberAverageRating(doc.barberId);
            
            await Barber.findByIdAndUpdate(doc.barberId, {
                averageRating: stats.averageRating,
                totalReviews: stats.totalReviews
            });
        } catch (error) {
            console.error('Error updating barber rating:', error);
        }
    }
});

// Pre-remove middleware to update barber's average rating
bookingFeedbackSchema.post('remove', async function(doc) {
    try {
        const Barber = mongoose.model('Barber');
        const stats = await mongoose.model('BookingFeedback').getBarberAverageRating(doc.barberId);
        
        await Barber.findByIdAndUpdate(doc.barberId, {
            averageRating: stats.averageRating,
            totalReviews: stats.totalReviews
        });
    } catch (error) {
        console.error('Error updating barber rating after removal:', error);
    }
});

const BookingFeedback = mongoose.model('BookingFeedback', bookingFeedbackSchema);
module.exports = BookingFeedback;
