const NoShow = require('../models/no-show.model');
const User = require('../models/user.model');

// Get customer's no-show history
exports.getCustomerNoShowHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 10 } = req.query;

    const history = await NoShow.getCustomerHistory(customerId, parseInt(limit));
    const count = await NoShow.getCustomerNoShowCount(customerId);
    const isBlocked = await NoShow.isCustomerBlocked(customerId);

    res.json({
      history,
      totalCount: count,
      isBlocked,
      blockingLimit: 3
    });

  } catch (err) {
    console.error('Error getting customer no-show history:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all no-shows with pagination (admin)
exports.getAllNoShows = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      customerId, 
      barberId, 
      isExcused,
      reason,
      startDate,
      endDate 
    } = req.query;

    const filter = {};
    
    if (customerId) filter.customerId = customerId;
    if (barberId) filter.barberId = barberId;
    if (isExcused !== undefined) filter.isExcused = isExcused === 'true';
    if (reason) filter.reason = reason;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [noShows, total] = await Promise.all([
      NoShow.find(filter)
        .populate('customerId', 'name email phone')
        .populate('bookingId', 'bookingDate status')
        .populate('barberId', 'userId')
        .populate('serviceId', 'name')
        .populate('markedBy', 'name')
        .populate('excusedBy', 'name')
        .populate({
          path: 'barberId',
          populate: {
            path: 'userId',
            select: 'name'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      NoShow.countDocuments(filter)
    ]);

    res.json({
      noShows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (err) {
    console.error('Error getting all no-shows:', err);
    res.status(500).json({ message: err.message });
  }
};

// Excuse a specific no-show (admin)
exports.excuseNoShow = async (req, res) => {
  try {
    const { noShowId } = req.params;
    const { reason } = req.body;
    const adminId = req.userId;

    const noShow = await NoShow.findById(noShowId);
    if (!noShow) {
      return res.status(404).json({ message: 'No-show record not found' });
    }

    if (noShow.isExcused) {
      return res.status(400).json({ message: 'This no-show is already excused' });
    }

    await noShow.excuse(adminId, reason);

    res.json({
      message: 'No-show excused successfully',
      noShow
    });

  } catch (err) {
    console.error('Error excusing no-show:', err);
    res.status(500).json({ message: err.message });
  }
};

// Reset customer's no-show count (admin)
exports.resetCustomerNoShows = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { reason } = req.body;
    const adminId = req.userId;

    // Verify customer exists
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const countBefore = await NoShow.getCustomerNoShowCount(customerId);
    
    if (countBefore === 0) {
      return res.status(400).json({ message: 'Customer has no active no-shows to reset' });
    }

    const result = await NoShow.resetCustomerNoShows(customerId, adminId, reason);

    res.json({
      message: 'Customer no-shows reset successfully',
      customerId,
      customerName: customer.name,
      noShowsReset: result.modifiedCount,
      previousCount: countBefore,
      newCount: 0,
      resetBy: adminId,
      resetReason: reason
    });

  } catch (err) {
    console.error('Error resetting customer no-shows:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get no-show statistics (admin)
exports.getNoShowStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get basic statistics
    const stats = await NoShow.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalNoShows: { $sum: 1 },
          excusedNoShows: { $sum: { $cond: ['$isExcused', 1, 0] } },
          customerCancellations: { $sum: { $cond: [{ $eq: ['$reason', 'customer_cancelled'] }, 1, 0] } },
          actualNoShows: { $sum: { $cond: [{ $eq: ['$reason', 'no_show'] }, 1, 0] } },
          lateCancellations: { $sum: { $cond: [{ $eq: ['$reason', 'late_cancellation'] }, 1, 0] } }
        }
      }
    ]);

    // Get customers with high no-show counts
    const blockedCustomers = await NoShow.aggregate([
      {
        $match: { isExcused: false }
      },
      {
        $group: {
          _id: '$customerId',
          noShowCount: { $sum: 1 }
        }
      },
      {
        $match: { noShowCount: { $gte: 3 } }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      {
        $project: {
          customerId: '$_id',
          customerName: '$customer.name',
          customerEmail: '$customer.email',
          noShowCount: 1
        }
      },
      {
        $sort: { noShowCount: -1 }
      }
    ]);

    const result = stats[0] || {
      totalNoShows: 0,
      excusedNoShows: 0,
      customerCancellations: 0,
      actualNoShows: 0,
      lateCancellations: 0
    };

    res.json({
      period: {
        startDate: start,
        endDate: end
      },
      statistics: result,
      blockedCustomers,
      blockedCustomersCount: blockedCustomers.length
    });

  } catch (err) {
    console.error('Error getting no-show statistics:', err);
    res.status(500).json({ message: err.message });
  }
};

// Check if customer is blocked
exports.checkCustomerStatus = async (req, res) => {
  try {
    const { customerId } = req.params;

    const [count, isBlocked, history] = await Promise.all([
      NoShow.getCustomerNoShowCount(customerId),
      NoShow.isCustomerBlocked(customerId),
      NoShow.getCustomerHistory(customerId, 5)
    ]);

    res.json({
      customerId,
      noShowCount: count,
      isBlocked,
      blockingLimit: 3,
      recentHistory: history
    });

  } catch (err) {
    console.error('Error checking customer status:', err);
    res.status(500).json({ message: err.message });
  }
};
