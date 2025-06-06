import React from 'react';
import { Modal, Image, Rate, Tag, Typography, Row, Col, Button } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

const { Text } = Typography;

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
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Reviewer:</Text>
            <div>{feedback.userId?.name || 'Anonymous'}</div>
          </Col>
          <Col span={12}>
            <Text strong>Product:</Text>
            <div>{feedback.productId?.name || 'N/A'}</div>
          </Col>
        </Row>

        <div className="modal-section">
          <Text strong>Rating:</Text>
          <div>
            <Rate disabled value={feedback.rating} />
            <Text strong>{feedback.rating}/5</Text>
          </div>
        </div>

        <div className="modal-section">
          <Text strong>Comment:</Text>
          <div>{feedback.comment || 'No comment'}</div>
        </div>

        {feedback.images?.length > 0 && (
          <div className="modal-section">
            <Text strong>Images:</Text>
            <Image.PreviewGroup>
              {feedback.images.map((url, idx) => (
                <Image
                  key={idx}
                  width={100}
                  height={100}
                  src={url}
                  style={{ marginRight: 8 }}
                />
              ))}
            </Image.PreviewGroup>
          </div>
        )}

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Text strong>Status:</Text>
            <div>
              {feedback.isApproved ? (
                <Tag color="success" icon={<CheckOutlined />}>Approved</Tag>
              ) : (
                <Tag color="warning" icon={<CloseOutlined />}>Pending</Tag>
              )}
            </div>
          </Col>
          <Col span={12}>
            <Text strong>Created At:</Text>
            <div>{new Date(feedback.createdAt).toLocaleString()}</div>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default FeedbackProductModal;