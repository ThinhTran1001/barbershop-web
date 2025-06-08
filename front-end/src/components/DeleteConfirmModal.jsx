import React from 'react';
import { Modal, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const DeleteConfirmModal = ({ visible, onOk, onCancel, submitting, deletingDiscount }) => {
  return (
    <Modal
      title="Confirm Discount Deletion"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      okText="Delete"
      cancelText="Cancel"
      okType="danger"
      confirmLoading={submitting}
      centered
    >
      <Space align="start">
        <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 24, marginTop: 4 }} />
        <div>
          <p>Are you sure you want to delete the discount for the product:</p>
          <p><strong>"{deletingDiscount?.productName}"</strong></p>
          <p style={{ color: '#ff4d4f', fontSize: '12px', marginTop: 8 }}>
             This action cannot be undone.
          </p>
        </div>
      </Space>
    </Modal>
  );
};

export default DeleteConfirmModal;