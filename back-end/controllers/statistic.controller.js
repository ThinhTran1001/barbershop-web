const Order = require('../models/order.model');
const Booking = require('../models/booking.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Barber = require('../models/barber.model');
const Service = require('../models/service.model');
const Voucher = require('../models/voucher.model');


const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

 
    const totalOrders = await Order.countDocuments();
    const ordersThisMonth = await Order.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    const ordersThisYear = await Order.countDocuments({
      createdAt: { $gte: startOfYear }
    });

    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const revenueThisMonth = await Order.aggregate([
      { 
        $match: { 
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: startOfMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const revenueThisYear = await Order.aggregate([
      { 
        $match: { 
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: startOfYear }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

   
    const totalBookings = await Booking.countDocuments();
    const bookingsThisMonth = await Booking.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });

    // Thống kê người dùng
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalBarbers = await User.countDocuments({ role: 'barber' });
    const newUsersThisMonth = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: startOfMonth }
    });

   
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });

    
    const totalServices = await Service.countDocuments();
    const activeServices = await Service.countDocuments({ isActive: true });


    const totalVouchers = await Voucher.countDocuments();
    const activeVouchers = await Voucher.countDocuments({ 
      isActive: true,
      expiryDate: { $gt: new Date() }
    });

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          thisMonth: ordersThisMonth,
          thisYear: ordersThisYear
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          thisMonth: revenueThisMonth[0]?.total || 0,
          thisYear: revenueThisYear[0]?.total || 0
        },
        bookings: {
          total: totalBookings,
          thisMonth: bookingsThisMonth,
          completed: completedBookings,
          pending: pendingBookings
        },
        users: {
          total: totalUsers,
          barbers: totalBarbers,
          newThisMonth: newUsersThisMonth
        },
        products: {
          total: totalProducts,
          active: activeProducts
        },
        services: {
          total: totalServices,
          active: activeServices
        },
        vouchers: {
          total: totalVouchers,
          active: activeVouchers
        }
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const getRevenueStats = async (req, res) => {
  try {
    const { period = 'month', year = new Date().getFullYear() } = req.query;
    
    let groupBy, dateFormat;
    if (period === 'month') {
      groupBy = { $month: '$createdAt' };
      dateFormat = { $month: '$createdAt' };
    } else if (period === 'week') {
      groupBy = { $week: '$createdAt' };
      dateFormat = { $week: '$createdAt' };
    } else {
      groupBy = { $year: '$createdAt' };
      dateFormat = { $year: '$createdAt' };
    }

    const revenueStats = await Order.aggregate([
      { 
        $match: { 
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: new Date(year, 0, 1) }
        } 
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: revenueStats
    });
  } catch (error) {
    console.error('Error getting revenue stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const getOrderStats = async (req, res) => {
  try {
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

  
    const monthlyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: orderStats,
        monthly: monthlyOrders
      }
    });
  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const getBookingStats = async (req, res) => {
  try {
    const bookingStats = await Booking.aggregate([
      {
        $lookup: {
          from: 'barbers',
          localField: 'barberId',
          foreignField: '_id',
          as: 'barber'
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $group: {
          _id: '$barberId',
          barberName: { $first: '$barber.name' },
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          noShowBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] }
          }
        }
      },
      { $sort: { totalBookings: -1 } }
    ]);


    const statusStats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const serviceStats = await Booking.aggregate([
      {
        $group: {
          _id: '$serviceId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $project: {
          serviceName: { $arrayElemAt: ['$service.name', 0] },
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        byBarber: bookingStats,
        byStatus: statusStats,
        byService: serviceStats
      }
    });
  } catch (error) {
    console.error('Error getting booking stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const getUserStats = async (req, res) => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          verifiedUsers: {
            $sum: { $cond: ['$isVerified', 1, 0] }
          }
        }
      }
    ]);

 
    const monthlyUsers = await User.aggregate([
      {
        $match: {
          role: 'customer',
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        byRole: userStats,
        monthly: monthlyUsers
      }
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$product.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    console.error('Error getting top products:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getDashboardStats,
  getRevenueStats,
  getOrderStats,
  getBookingStats,
  getUserStats,
  getTopProducts
};
