import React from 'react';
import { Modal, Image, Rate, Tag } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

const FeedbackBarberModal = ({ open, onCancel, feedback }) => {
  if (!feedback) return null;

  return (
    <Modal
      title="Customer Feedback"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <strong>Booking ID:</strong> {feedback.bookingId?._id || feedback.bookingId || 'N/A'}
        </div>
        <div>
          <strong>Barber:</strong> {feedback.barberId?.name || feedback.barberId?._id || 'Unknown'}
        </div>
        <div>
          <strong>Customer:</strong> {feedback.reviewer || feedback.customerId?.name || feedback.customerId?._id || 'Unknown'}
        </div>
        <div>
          <strong>Rating:</strong> <Rate disabled value={feedback.rating || 0} style={{ marginLeft: 8 }} />
        </div>
        <div>
          <strong>Comment:</strong> {feedback.comment || 'No comment'}
        </div>
        <div>
          <strong>Status:</strong>
          <Tag color={feedback.isApproved ? 'success' : 'warning'} style={{ marginLeft: 8 }}>
            {feedback.isApproved ? 'Approved' : 'Pending'}
          </Tag>
        </div>
        <div>
          <strong>Created At:</strong> {feedback.createdAt ? new Date(feedback.createdAt).toLocaleString('en-GB') : 'N/A'}
        </div>
        {feedback.images?.length > 0 && (
          <div>
            <strong>Images:</strong>
            <Image.PreviewGroup>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {feedback.images.map((img, index) => (
                  <Image
                    key={index}
                    width={100}
                    src={img}
                    style={{ borderRadius: 8, objectFit: 'cover' }}
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