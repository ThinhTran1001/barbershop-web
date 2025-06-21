import React from 'react';
import { Modal, Image, Rate, Tag, Row, Col, Divider } from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined, ScissorOutlined, FileTextOutlined } from '@ant-design/icons';

const FeedbackBarberModal = ({ open, onCancel, feedback }) => {
  if (!feedback) return null;

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString('en-GB') : 'N/A';
  };

  return (
    <Modal
      title="Feedback Details"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={650}
    >
      <div style={{ padding: '8px 0' }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserOutlined style={{ color: '#1890ff' }} />
              <strong>Customer:</strong>
            </div>
            <div style={{ marginLeft: 24, marginTop: 4 }}>
              {feedback.reviewer || feedback.customerId?.name || feedback.customerId?._id || 'Unknown'}
            </div>
          </Col>
          
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ScissorOutlined style={{ color: '#52c41a' }} />
              <strong>Barber:</strong>
            </div>
            <div style={{ marginLeft: 24, marginTop: 4, color: '#52c41a', fontWeight: 500 }}>
              {feedback.barberId?.name || feedback.barberId?._id || 'Unknown Barber'}
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileTextOutlined style={{ color: '#722ed1' }} />
              <strong>Booking ID:</strong>
            </div>
            <div style={{ marginLeft: 24, marginTop: 4 }}>
              {feedback.bookingId?._id || feedback.bookingId || 'N/A'}
            </div>
          </Col>
          
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong>Status:</strong>
            </div>
            <div style={{ marginLeft: 0, marginTop: 4 }}>
              <Tag 
                color={feedback.isApproved ? 'success' : 'warning'} 
                icon={feedback.isApproved ? <CheckOutlined /> : <CloseOutlined />}
              >
                {feedback.isApproved ? 'Approved' : 'Pending'}
              </Tag>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ marginBottom: 16 }}>
          <strong>Rating:</strong>
          <div style={{ marginTop: 8 }}>
            <Rate disabled value={feedback.rating || 0} />
            <span style={{ marginLeft: 8, fontWeight: 'bold', color: '#faad14' }}>
              {feedback.rating || 0}/5
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <strong>Comment:</strong>
          <div style={{ 
            marginTop: 8, 
            padding: 12, 
            backgroundColor: '#f8f9fa', 
            borderRadius: 6,
            minHeight: 60,
            lineHeight: '1.5',
            wordBreak: 'break-word'
          }}>
            {feedback.comment || 'No comment provided'}
          </div>
        </div>

        {feedback.images?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <strong>Images ({feedback.images.length}):</strong>
            <Image.PreviewGroup>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {feedback.images.map((img, index) => (
                  <Image
                    key={index}
                    width={80}
                    height={80}
                    src={img}
                    style={{ borderRadius: 6, objectFit: 'cover' }}
                  />
                ))}
              </div>
            </Image.PreviewGroup>
          </div>
        )}

        <div style={{ color: '#666', fontSize: 14 }}>
          <strong>Created:</strong> {formatDate(feedback.createdAt)}
        </div>
      </div>
    </Modal>
  );
};

export default FeedbackBarberModal;