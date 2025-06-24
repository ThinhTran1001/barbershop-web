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
        const vouchers = await Voucher.find({isActive: true});
        res.status(200).json({ data: vouchers });
    } catch (error) {
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