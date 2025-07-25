// components/landing/ServiceFeedbackList.jsx
import React, { useEffect, useState } from "react";
import { getServiceFeedback, getAllServiceFeedback } from "../../services/bookingFeedbackApi";
import { Avatar, Typography, Rate, Skeleton, Modal, Select } from "antd";
import dayjs from "dayjs";
import "../../css/product/productdetail.css"; // reuse product review styling
import { UserOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function ServiceFeedbackList() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [ratingFilter, setRatingFilter] = useState("");

  useEffect(() => {
  const fetchFeedbacks = async () => {
    try {
      const params = { status: "approved" };
      if (ratingFilter) {
        params.rating = ratingFilter;
      }

      const res = await getAllServiceFeedback(params);
      const extracted = Array.isArray(res.data) ? res.data : [];
      setFeedbacks(extracted);
    } catch (err) {
      console.error("Error fetching service feedback:", err);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  fetchFeedbacks();
}, [ratingFilter]);




  const showImagePreview = (img) => {
    setPreviewImage(img);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setPreviewImage("");
    setIsModalVisible(false);
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  return (
    <div className="product-details-tabs" style={{ marginTop: "40px" }}>
      <Title level={3} className="review-title">Đánh giá dịch vụ</Title>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
  <Select
    defaultValue=""
    onChange={(value) => setRatingFilter(value)}
    style={{ width: 200 }}
  >
    <Select.Option value="">Tất cả đánh giá</Select.Option>
    <Select.Option value="5">Chỉ 5 sao</Select.Option>
    <Select.Option value="4">Từ 4 sao trở lên</Select.Option>
    <Select.Option value="3">Từ 3 sao trở lên</Select.Option>
    <Select.Option value="2">Từ 2 sao trở lên</Select.Option>
    <Select.Option value="1">Từ 1 sao trở lên</Select.Option>
  </Select>
</div>

      {feedbacks.length > 0 ? (
        <div className="review-list">
          {feedbacks.map((review, idx) => (
            <div key={idx} className="review-card">
              <div className="review-header">
                <Avatar
                  size={48}
                  src={review.customerId?.avatar || undefined}
                  className="review-avatar"
                >
                  {review.customerId?.name?.charAt(0) || <UserOutlined />}
                </Avatar>
                <div className="review-details">
                  <Text strong className="review-author">
                    {review.customerId?.name || "Khách hàng ẩn danh"}
                  </Text>
                  <Text type="secondary" className="review-service-name">
                    <b>Dịch vụ:</b> {review.serviceId?.name || "Không rõ"}
                  </Text>
                  <div className="review-rating-row">
                    <Rate disabled allowHalf value={review.rating || 0} />
                    <Text className="review-date">
                      at: {dayjs(review.createdAt).format("DD MMMM YYYY, HH:mm")}
                    </Text>
                  </div>
                </div>
              </div>
              <div className="review-comment-container">
                <Text className="review-comment">
                  {review.comment || "Không có bình luận"}
                </Text>
              </div>
              {review.images && review.images.length > 0 && (
                <div className="review-images-container">
                  {review.images.map((img, imgIdx) => (
                    <img
                      key={imgIdx}
                      src={img.url}
                      alt={`review-image-${imgIdx}`}
                      className="review-image"
                      onClick={() => showImagePreview(img.url)}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "";
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Text className="no-reviews">Chưa có đánh giá nào cho dịch vụ.</Text>
      )}

      <Modal
        visible={isModalVisible}
        footer={null}
        onCancel={handleModalClose}
        className="image-preview-modal"
      >
        <img src={previewImage} alt="Preview" className="preview-image" />
      </Modal>
    </div>
  );
}
