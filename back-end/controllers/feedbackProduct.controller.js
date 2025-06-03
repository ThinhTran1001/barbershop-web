const mongoose = require('mongoose');
const ProductReview = require('../models/feedbackProduct.model');

// Tạo đánh giá sản phẩm mới
exports.createProductReview = async (req, res) => {
  try {
    const review = new ProductReview(req.body);
    const savedReview = await review.save();

    // Populate thông tin để trả về đầy đủ
    const populatedReview = await ProductReview.findById(savedReview._id)
      .populate('productId', 'name price images')
      .populate('customerId', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Đánh giá sản phẩm đã được tạo thành công',
      data: populatedReview
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Lấy tất cả đánh giá sản phẩm
exports.getAllProductReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, approved, rating } = req.query;

    let filter = {};
    if (typeof approved !== 'undefined') {
      filter.isApproved = approved === 'true';
    }
    if (rating) filter.rating = parseInt(rating);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const reviews = await ProductReview.find(filter)
      .populate('productId', 'name price images category')
      .populate('customerId', 'name email avatar')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await ProductReview.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalReviews: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Lấy đánh giá theo sản phẩm
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating = null } = req.query;

    let filter = { productId, isApproved: true };
    if (rating) filter.rating = parseInt(rating);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const reviews = await ProductReview.find(filter)
      .populate('customerId', 'name avatar')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    // Tính toán thống kê rating
    const ratingStats = await ProductReview.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId), isApproved: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const total = await ProductReview.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: reviews,
      statistics: ratingStats[0] || { averageRating: 0, totalReviews: 0 },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalReviews: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Lấy đánh giá theo customer
exports.getReviewsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const reviews = await ProductReview.find({ customerId })
      .populate('productId', 'name price images')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await ProductReview.countDocuments({ customerId });

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalReviews: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Duyệt đánh giá sản phẩm
exports.approveProductReview = async (req, res) => {
  try {
    const updatedReview = await ProductReview.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: true,
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate('productId', 'name')
      .populate('customerId', 'name');

    if (!updatedReview) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá sản phẩm'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đánh giá sản phẩm đã được duyệt',
      data: updatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Cập nhật đánh giá sản phẩm
exports.updateProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    const updatedReview = await ProductReview.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('productId', 'name')
      .populate('customerId', 'name');

    if (!updatedReview) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá sản phẩm'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đánh giá sản phẩm đã được cập nhật',
      data: updatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Đánh dấu review hữu ích
exports.markReviewHelpful = async (req, res) => {
  try {
    const updatedReview = await ProductReview.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!updatedReview) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá sản phẩm'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu review hữu ích',
      data: { helpfulCount: updatedReview.helpfulCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Xóa đánh giá sản phẩm
exports.deleteProductReview = async (req, res) => {
  try {
    const deleted = await ProductReview.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá sản phẩm'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đánh giá sản phẩm đã được xóa'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
