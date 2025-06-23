const User_Voucher = require('../models/user_voucher.model');
const Voucher = require('../models/voucher.model');

// GET all user voucher assignments
exports.getAllUserVouchers = async (req, res) => {
    try {
        const { 
            search, 
            status, 
            sortBy, 
            sortOrder = 'desc', 
            page = 1, 
            limit = 10 
        } = req.query;

        // Build query filters
        let queryFilters = {};

        // Search functionality - search by voucher code, voucher name, or user name
        if (search) {
            queryFilters.$or = [
                { 'voucherId.code': { $regex: search, $options: 'i' } },
                { 'voucherId.name': { $regex: search, $options: 'i' } },
                { 'userId.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Status filter
        if (status !== undefined && status !== null && status !== '') {
            queryFilters.isUsed = status === 'true' || status === true;
        }

        // Build sort options
        let sortOptions = {};
        if (sortBy) {
            switch (sortBy) {
                case 'assignedAt':
                    sortOptions.assignedAt = sortOrder === 'asc' ? 1 : -1;
                    break;
                case 'createdAt':
                    sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
                    break;
                case 'updatedAt':
                    sortOptions.updatedAt = sortOrder === 'asc' ? 1 : -1;
                    break;
                case 'user':
                    sortOptions['userId.name'] = sortOrder === 'asc' ? 1 : -1;
                    break;
                case 'voucher':
                    sortOptions['voucherId.code'] = sortOrder === 'asc' ? 1 : -1;
                    break;
                default:
                    sortOptions.createdAt = -1; // Default sort
            }
        } else {
            sortOptions.createdAt = -1; // Default sort
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // First, get total count for pagination
        const totalCount = await User_Voucher.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userId'
                }
            },
            {
                $lookup: {
                    from: 'vouchers',
                    localField: 'voucherId',
                    foreignField: '_id',
                    as: 'voucherId'
                }
            },
            {
                $unwind: '$userId'
            },
            {
                $unwind: '$voucherId'
            },
            {
                $match: queryFilters
            },
            {
                $count: 'total'
            }
        ]);

        const total = totalCount.length > 0 ? totalCount[0].total : 0;

        // Get the actual data with pagination
        const userVouchers = await User_Voucher.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userId'
                }
            },
            {
                $lookup: {
                    from: 'vouchers',
                    localField: 'voucherId',
                    foreignField: '_id',
                    as: 'voucherId'
                }
            },
            {
                $unwind: '$userId'
            },
            {
                $unwind: '$voucherId'
            },
            {
                $match: queryFilters
            },
            {
                $sort: sortOptions
            },
            {
                $skip: skip
            },
            {
                $limit: parseInt(limit)
            },
            {
                $project: {
                    _id: 1,
                    isUsed: 1,
                    assignedAt: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    'userId._id': 1,
                    'userId.name': 1,
                    'userId.email': 1,
                    'voucherId._id': 1,
                    'voucherId.code': 1,
                    'voucherId.name': 1,
                    'voucherId.description': 1
                }
            }
        ]);

        res.status(200).json({ 
            success: true, 
            data: userVouchers,
            pagination: {
                currentPage: parseInt(page),
                pageSize: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('getAllUserVouchers error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// GET a single user voucher by ID
exports.getUserVoucherById = async (req, res) => {
    try {
        const userVoucher = await User_Voucher.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('voucherId');
        if (!userVoucher) {
            return res.status(404).json({ success: false, message: 'User voucher not found' });
        }
        res.status(200).json({ success: true, data: userVoucher });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// POST - Assign a new voucher to a user
exports.assignVoucherToUser = async (req, res) => {
    try {
        const { userId, voucherId } = req.body;
        const existing = await User_Voucher.findOne({ userId, voucherId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'This voucher has already been assigned to the user.' });
        }
        const newUserVoucher = new User_Voucher({ userId, voucherId, isUsed: false });
        await newUserVoucher.save();
        res.status(201).json({ success: true, data: newUserVoucher });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT - Update a user voucher (e.g., mark as used)
exports.updateUserVoucher = async (req, res) => {
    try {
        const userVoucher = await User_Voucher.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!userVoucher) {
            return res.status(404).json({ success: false, message: 'User voucher not found' });
        }
        res.status(200).json({ success: true, data: userVoucher });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// DELETE - Delete a user voucher assignment
exports.deleteUserVoucher = async (req, res) => {
    try {
        const userVoucher = await User_Voucher.findByIdAndDelete(req.params.id);
        if (!userVoucher) {
            return res.status(404).json({ success: false, message: 'User voucher not found' });
        }
        res.status(200).json({ success: true, message: 'User voucher deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Lấy danh sách voucher của 1 người dùng
exports.getVouchersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const userVouchers = await User_Voucher.find({ userId })
      .populate('voucherId') // Để lấy thông tin voucher chi tiết
      .sort({ assignedAt: -1 });

    res.status(200).json({ success: true, data: userVouchers });
  } catch (err) {
    console.error('getVouchersByUser error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Đánh dấu voucher đã dùng
exports.markVoucherUsed = async (req, res) => {
  try {
    const { userId, voucherId } = req.body;

    const userVoucher = await User_Voucher.findOneAndUpdate(
      { userId, voucherId },
      { isUsed: true },
      { new: true }
    );

    if (!userVoucher) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user-voucher' });
    }

    // Tăng usedCount ở bảng Voucher
    await Voucher.findByIdAndUpdate(voucherId, { $inc: { usedCount: 1 } });

    res.status(200).json({ success: true, message: 'Đánh dấu đã dùng', data: userVoucher });
  } catch (err) {
    console.error('markVoucherUsed error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Đánh dấu hoàn lại voucher (dùng khi huỷ đơn)
exports.rollbackVoucherUsage = async (req, res) => {
  try {
    const { userId, voucherId } = req.body;

    const userVoucher = await User_Voucher.findOneAndUpdate(
      { userId, voucherId, isUsed: true },
      { isUsed: false },
      { new: true }
    );

    if (!userVoucher) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user-voucher đã dùng' });
    }

    // Giảm usedCount ở bảng Voucher
    await Voucher.findByIdAndUpdate(voucherId, { $inc: { usedCount: -1 } });

    res.status(200).json({ success: true, message: 'Hoàn lại lượt dùng voucher', data: userVoucher });
  } catch (err) {
    console.error('rollbackVoucherUsage error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
