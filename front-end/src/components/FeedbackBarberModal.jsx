import React from 'react';
import { Modal, Image, Rate, Tag, Typography, Row, Col, Button } from 'antd';
import { CheckOutlined, CloseOutlined, DeleteOutlined, UserOutlined, ScissorOutlined, FileTextOutlined } from '@ant-design/icons';

const { Text } = Typography;

const renderStatusTag = (status) => {
  if (status === 'approved') return <Tag color="success" icon={<CheckOutlined />}>Approved</Tag>;
  if (status === 'unapproved') return <Tag color="warning" icon={<CloseOutlined />}>Unapproved</Tag>;
  if (status === 'deleted') return <Tag color="error" icon={<DeleteOutlined />}>Deleted</Tag>;
  return null;
};

const FeedbackBarberModal = ({ open, onCancel, feedback }) => {
  if (!feedback) return null;

  return (
    <Modal
      title="Feedback Details"
      open={open}
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
            <Text strong>Customer:</Text>
            <div className="feedback-modal-data">{feedback.reviewer || feedback.customerId?.name || feedback.customerId?._id || 'Unknown'}</div>
          </Col>
          <Col span={12}>
            <Text strong>Barber:</Text>
            <div className="feedback-modal-data">{feedback.barberId?.userId?.name || feedback.barberId?.name || feedback.barberId?._id || 'Unknown Barber'}</div>
          </Col>
        </Row>

        <Row gutter={16} className="feedback-modal-row">
          <Col span={12}>
            <Text strong>Booking:</Text>
            <div className="feedback-modal-data">
              {(() => {
                const booking = feedback.bookingId;
                if (!booking) return 'N/A';
                if (booking.name) return booking.name;
                if (booking.title) return booking.title;
                if (booking.bookingDate) return new Date(booking.bookingDate).toLocaleString();
                if (booking._id) return booking._id.slice(0, 8) + '...';
                if (typeof booking === 'string') return booking.slice(0, 8) + '...';
                return 'N/A';
              })()}
            </div>
          </Col>
          <Col span={12}>
            <Text strong>Status:</Text>
            <div className="feedback-modal-status-container">
              {renderStatusTag(feedback.status)}
            </div>
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

export default FeedbackBarberModal;