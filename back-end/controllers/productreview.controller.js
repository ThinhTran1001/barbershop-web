const ProductReview = require('../models/productreview.model');
const Product = require('../models/product.model'); 

// Hàm tính toán và cập nhật rating của sản phẩm
const updateProductRating = async (productId) => {
  try {
    const activeReviews = await ProductReview.find({ productId, isDeleted: false });
    if (activeReviews.length === 0) {
      await Product.findByIdAndUpdate(productId, { rating: 0, reviews: 0 });
      return;
    }

    const totalRating = activeReviews.reduce((sum, review) => sum + review.rating, 0);
    const newRating = totalRating / activeReviews.length;
    const newReviewsCount = activeReviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: newRating,
      reviews: newReviewsCount
    });
  } catch (error) {
    console.error('Error updating product rating:', error);
    throw error;
  }
};

// GET - Lấy tất cả reviews
const getAllReviews = async (req, res) => {
  try {
    // Sửa: chỉ filter isDeleted nếu có truyền tham số
    const { isDeleted } = req.query;
    const query = {};
    if (typeof isDeleted !== 'undefined') {
      query.isDeleted = isDeleted === 'true';
    }
    const reviews = await ProductReview.find(query)
      .populate('userId', 'name email')
      .populate('productId', 'name rating reviews') // Thêm rating và reviews
      .sort({ createdAt: -1 });
    
    // Tự động cập nhật rating cho tất cả sản phẩm có feedback
    const productIds = [...new Set(reviews.map(review => review.productId._id.toString()))];
    for (const productId of productIds) {
      await updateProductRating(productId);
    }
    
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
    const { isDeleted } = req.query;
    const query = { productId };
    if (typeof isDeleted !== 'undefined') {
      query.isDeleted = isDeleted === 'true';
    }
    const reviews = await ProductReview.find(query)
      .populate('userId', 'name email')
      .populate('productId', 'name rating reviews')
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
      images: images || []
    });

    const savedReview = await newReview.save();
    
    const populatedReview = await ProductReview.findById(savedReview._id)
      .populate('userId', 'name email')
      .populate('productId', 'name rating reviews');

    // Cập nhật rating của sản phẩm sau khi tạo review
    await updateProductRating(productId);

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
    // Soft delete: set isDeleted to true
    deletedReview.isDeleted = true;
    await deletedReview.save();
    // Cập nhật rating của sản phẩm sau khi xóa review
    await updateProductRating(deletedReview.productId);
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully (soft delete)'
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
  deleteReview
};