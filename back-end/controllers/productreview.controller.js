const ProductReview = require('../models/ProductReview.model');
const Product = require('../models/product.model'); 

// Hàm tính toán và cập nhật rating của sản phẩm
const updateProductRating = async (productId) => {
  try {
    const approvedReviews = await ProductReview.find({ productId, isApproved: true });
    if (approvedReviews.length === 0) {
      await Product.findByIdAndUpdate(productId, { rating: 0, feedbackCount: 0 });
      return;
    }

    const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
    const newRating = totalRating / approvedReviews.length;
    const newFeedbackCount = approvedReviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: newRating,
      feedbackCount: newFeedbackCount
    });
  } catch (error) {
    console.error('Error updating product rating:', error);
    throw error;
  }
};

// GET - Lấy tất cả reviews
const getAllReviews = async (req, res) => {
  try {
    const reviews = await ProductReview.find()
      .populate('userId', 'name email')
      .populate('productId', 'name rating feedbackCount') // Thêm rating và feedbackCount
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// GET - Lấy reviews theo productId
const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await ProductReview.find({ productId })
      .populate('userId', 'name email')
      .populate('productId', 'name rating feedbackCount')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching reviews by product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews by product',
      error: error.message
    });
  }
};

// POST - Tạo review mới
const createReview = async (req, res) => {
  try {
    const { userId, productId, rating, comment, images } = req.body;
    
    if (!userId || !productId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'userId, productId and rating are required'
      });
    }

    const newReview = new ProductReview({
      userId,
      productId,
      rating,
      comment: comment || '',
      images: images || [],
      isApproved: false
    });

    const savedReview = await newReview.save();
    
    const populatedReview = await ProductReview.findById(savedReview._id)
      .populate('userId', 'name email')
      .populate('productId', 'name rating feedbackCount');

    res.status(201).json({
      success: true,
      data: populatedReview,
      message: 'Review created successfully'
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message
    });
  }
};

// PATCH - Approve review
const approveReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedReview = await ProductReview.findByIdAndUpdate(
      id,
      { isApproved: true },
      { new: true }
    )
    .populate('userId', 'name email')
    .populate('productId', 'name rating feedbackCount');

    if (!updatedReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Cập nhật rating của sản phẩm
    await updateProductRating(updatedReview.productId);

    res.status(200).json({
      success: true,
      data: updatedReview,
      message: 'Review approved successfully'
    });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve review',
      error: error.message
    });
  }
};

// PATCH - Unapprove review
const unapproveReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedReview = await ProductReview.findByIdAndUpdate(
      id,
      { isApproved: false },
      { new: true }
    )
    .populate('userId', 'name email')
    .populate('productId', 'name rating feedbackCount');

    if (!updatedReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Cập nhật rating của sản phẩm
    await updateProductRating(updatedReview.productId);

    res.status(200).json({
      success: true,
      data: updatedReview,
      message: 'Review unapproved successfully'
    });
  } catch (error) {
    console.error('Error unapproving review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unapprove review',
      error: error.message
    });
  }
};

// DELETE - Xóa review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedReview = await ProductReview.findById(id);
    if (!deletedReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await deletedReview.remove();

    // Cập nhật rating của sản phẩm nếu review đã approve
    if (deletedReview.isApproved) {
      await updateProductRating(deletedReview.productId);
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

module.exports = {
  getAllReviews,
  getReviewsByProduct,
  createReview,
  approveReview,
  unapproveReview,
  deleteReview
};