const Feedback = require('../models/feedbackProduct.model');

// Tạo đánh giá mới
exports.createFeedback = async (req, res) => {
  try {
    const { userId, productId, rating, comment, images } = req.body;

    if (!userId || !productId || !rating) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating phải từ 1 đến 5.' });
    }

    const existing = await Feedback.findOne({ userId, productId });
    if (existing) {
      return res.status(409).json({ message: 'Bạn đã đánh giá sản phẩm này rồi.' });
    }

    const feedback = new Feedback({
      userId,
      productId,
      rating,
      comment,
      images,
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy đánh giá theo productId
exports.getFeedbacksByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const feedbacks = await Feedback.find({ productId, isApproved: true })
      .sort({ createdAt: -1 })
      .populate('userId', 'name avatar');

    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy tất cả feedbacks (cho admin, có thể lọc theo isApproved)
exports.getAllFeedbacks = async (req, res) => {
  try {
    const { isApproved } = req.query;
    const filter = {};
    if (isApproved !== undefined) {
      filter.isApproved = isApproved === 'true';
    }
    const feedbacks = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name')
      .populate('productId', 'name');
    console.log("Dữ liệu từ database:", feedbacks);
    res.status(200).json(feedbacks);
  } catch (err) {
    console.error("Lỗi trong getAllFeedbacks:", err);
    res.status(500).json({ message: err.message });
  }
};

// Duyệt đánh giá (chỉ admin)
exports.approveFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Feedback.findByIdAndUpdate(id, { isApproved: true }, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy feedback.' });
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Xóa đánh giá
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Feedback.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy feedback để xóa.' });
    }

    res.status(200).json({ message: 'Đã xóa đánh giá.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createFeedback: exports.createFeedback,
  getFeedbacksByProduct: exports.getFeedbacksByProduct,
  getAllFeedbacks: exports.getAllFeedbacks,
  approveFeedback: exports.approveFeedback,
  deleteFeedback: exports.deleteFeedback,
};