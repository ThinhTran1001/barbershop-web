const Voucher = require("../models/voucher.model")
const User_Voucher = require('../models/user_voucher.model');

exports.createVoucher = async(req,res) =>{
    try {
        const voucherData = { ...req.body };
        const voucher = new Voucher(voucherData)
        const newVoucher = await voucher.save();
        res.status(201).json(newVoucher);
    } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
    }
}


exports.getAllVoucher = async(req,res) =>{
    try {
        const { startDate, endDate, isActive, sortByAmount, sortByUsageLimit, sortByUsedCount, page = 1, limit = 10 } = req.query;
        let queryFilters = {};
        let userVoucherIds = [];
        if (req.user && req.user.role === 'admin') {
            // Admin lấy tất cả
            if (startDate) {
                queryFilters.startDate = { $gte: new Date(startDate) };
            }
            if (endDate) {
                queryFilters.endDate = { $lte: new Date(endDate) };
            }
            if (isActive !== undefined && isActive !== null && isActive !== '') {
                queryFilters.isActive = String(isActive).toLowerCase() === 'true';
            }
        } else if (req.user) {
            // User: chỉ lấy các voucher active, còn hạn sử dụng, còn lượt dùng
            const now = new Date();
            queryFilters = {
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now },
                $expr: { $lt: ["$usedCount", "$usageLimit"] }
            };
        } else {
            // Không có quyền
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        const sortOptions = {};
        if (sortByAmount) {
            sortOptions.minOrderAmount = sortByAmount === 'asc' ? 1 : -1;
        } else if (sortByUsageLimit) {
            sortOptions.usageLimit = sortByUsageLimit === 'asc' ? 1 : -1;
        } else if (sortByUsedCount) {
            sortOptions.usedCount = sortByUsedCount === 'asc' ? 1 : -1;
        }
        const totalVouchers = await Voucher.countDocuments(queryFilters);
        const allVoucher = await Voucher.find(queryFilters)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        res.status(200).json({
            data: allVoucher,
            totalPages: Math.ceil(totalVouchers / limit),
            currentPage: parseInt(page),
            totalVouchers,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.getAllVoucherByUser = async(req,res) =>{
    try {
        const userId = req.user.id;
        const now = new Date();
        
        // 1. Lấy tất cả voucherId đã được gán cho user khác (để loại trừ khỏi voucher chung)
        const assignedToOthers = await User_Voucher.distinct('voucherId', { 
            userId: { $ne: userId } // Không phải user hiện tại
        });
        
        // 2. Lấy voucher chung (không được gán cho user khác)
        const publicVouchers = await Voucher.find({
            _id: { $nin: assignedToOthers }, // Không được gán cho user khác
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            $expr: { $lt: ["$usedCount", "$usageLimit"] }
        });

        // 3. Lấy voucher cá nhân của user này (chưa sử dụng)
        const userVouchers = await User_Voucher.find({ 
            userId: userId,
            isUsed: false // Chỉ lấy voucher chưa sử dụng
        }).populate('voucherId');

        const personalVouchers = userVouchers
            .map(uv => uv.voucherId)
            .filter(voucher => 
                voucher && 
                voucher.isActive && 
                voucher.startDate <= now && 
                voucher.endDate >= now &&
                voucher.usedCount < voucher.usageLimit
            );

        // 4. Gộp 2 danh sách và loại bỏ trùng lặp
        const allVouchers = [...publicVouchers];
        
        personalVouchers.forEach(personalVoucher => {
            // Kiểm tra xem voucher cá nhân đã có trong danh sách chung chưa
            const exists = allVouchers.some(v => v._id.toString() === personalVoucher._id.toString());
            if (!exists) {
                allVouchers.push(personalVoucher);
            }
        });

        // 5. Sắp xếp theo thời gian tạo mới nhất
        allVouchers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ 
            success: true,
            data: allVouchers,
            total: allVouchers.length
        });
    } catch (error) {
        console.error('getAllVoucherByUser error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}


exports.getSingerVoucher = async(req,res) =>{
    try {
        const oneVoucher = await Voucher.findById(req.params.id);
        if (!oneVoucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found' });
    }
    res.status(200).json({
      success: true,
      data: oneVoucher,
    });
    } catch (error) {
    res.status(500).json({ success: false, message: error.message });  
    }
}

exports.updateVoucher = async(req,res) =>{
    try {
        const voucherData = { ...req.body };
        const voucher = await Voucher.findByIdAndUpdate(req.params.id, voucherData,{new: true, runValidators : true});
           if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Update successful',
      data: voucher,
    });
    } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    }
}

exports.deleteVoucher = async(req,res) =>{
    try {
        const voucher = await Voucher.findByIdAndDelete(req.params.id);
        if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }
    res.status(200).json({ success: true, message: "Voucher deleted successfully" });
    } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    }
}