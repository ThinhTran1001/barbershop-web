import React from 'react';
import { Modal, Image, Rate, Tag, Typography, Row, Col, Button } from 'antd';
import { CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

const renderStatusTag = (status) => {
  if (status === 'active') return <Tag color="success" icon={<CheckOutlined />}>Active</Tag>;
  if (status === 'inactive') return <Tag color="warning" icon={<CloseOutlined />}>Inactive</Tag>;
  if (status === 'deleted') return <Tag color="error" icon={<DeleteOutlined />}>Deleted</Tag>;
  return null;
};

const FeedbackProductModal = ({ visible, onCancel, feedback }) => {
  if (!feedback) return null;

  return (
    <Modal
      title="Feedback Details"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>
      ]}
      width={600}
    >
      <div>
        <Row gutter={16} className="feedback-modal-row">
          <Col span={12}>
            <Text strong>Reviewer:</Text>
            <div className="feedback-modal-data">{feedback.userId?.name || 'Anonymous'}</div>
          </Col>
          <Col span={12}>
            <Text strong>Product:</Text>
            <div className="feedback-modal-data">{feedback.productId?.name || 'Unknown Product'}</div>
          </Col>
        </Row>

        <div className="feedback-modal-section">
          <Text strong>Rating:</Text>
          <div className="feedback-modal-rating">
            <Rate disabled value={feedback.rating || 0} />
            <Text strong className="feedback-modal-rating-text">{feedback.rating || 0}/5</Text>
          </div>
        </div>

        <div className="feedback-modal-section">
          <Text strong>Comment:</Text>
          <div className="feedback-modal-comment-container">
            {feedback.comment || 'No comment'}
          </div>
        </div>

        {feedback.images?.length > 0 && (
          <div className="feedback-modal-section">
            <Text strong>Images:</Text>
            <div className="feedback-modal-images-container">
              <Image.PreviewGroup>
                {feedback.images.map((url, idx) => (
                  <Image
                    key={idx}
                    width={100}
                    height={100}
                    src={url}
                    className="feedback-modal-image"
                  />
                ))}
              </Image.PreviewGroup>
            </div>
          </div>
        )}

        <Row gutter={16} className="feedback-modal-row">
          <Col span={12}>
            <Text strong>Status:</Text>
            <div className="feedback-modal-status-container">
              {renderStatusTag(feedback.status)}
            </div>
          </Col>
          <Col span={12}>
            <Text strong>Created At:</Text>
            <div className="feedback-modal-date-container">
              {feedback.createdAt ? new Date(feedback.createdAt).toLocaleString() : 'N/A'}
            </div>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default FeedbackProductModal;