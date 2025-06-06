import React from 'react';
import { Modal, Image, Rate, Tag } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

const FeedbackBarberModal = ({ visible, onCancel, feedback }) => {
  if (!feedback) return null;

  return (
    <Modal
      title="Customer Feedback"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <div>
        <p><strong>Booking ID:</strong> {feedback.bookingId?._id || feedback.bookingId}</p>
        <p><strong>Barber:</strong> {feedback.barberId?.name || feedback.barberId?._id || 'Unknown'}</p>
        <p><strong>Customer ID:</strong> {feedback.customerId?._id || feedback.customerId || 'Unknown'}</p>
        <p><strong>Rating:</strong> <Rate disabled defaultValue={feedback.rating} /></p>
        <p><strong>Comment:</strong> {feedback.comment}</p>
        <p><strong>Status:</strong>
          <Tag color={feedback.isApproved ? 'success' : 'warning'} style={{ marginLeft: 8 }}>
            {feedback.isApproved ? 'Approved' : 'Pending'}
          </Tag>
        </p>
        <p><strong>Created At:</strong> {new Date(feedback.createdAt).toLocaleString('en-GB')}</p>
        {feedback.images?.length > 0 && (
          <div>
            <strong>Images:</strong>
            <Image.PreviewGroup>
              <div style={{ marginTop: 8 }}>
                {feedback.images.map((img, index) => (
                  <Image
                    key={index}
                    width={100}
                    src={img}
                    style={{ margin: 4, borderRadius: 8, objectFit: 'cover' }}
                  />
                ))}
              </div>
            </Image.PreviewGroup>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default FeedbackBarberModal;
