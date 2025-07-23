import React, { useState } from 'react';
import { Table, Space, Tag, Image, Tooltip, Button, Spin, Empty, Typography, Badge, Rate, message } from 'antd';
import {
  UserOutlined, ShoppingOutlined, EyeOutlined, DeleteOutlined,
  CheckOutlined, CloseOutlined, UndoOutlined
} from '@ant-design/icons';
import PropTypes from 'prop-types';
import { updateFeedbackStatus } from '../services/api';
import { Modal, Button as BsButton, Toast, ToastContainer } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const { Text } = Typography;

const FeedbackProductTable = ({
  filteredFeedbacks,
  loading,
  handleViewFeedback,
  deleteFeedback
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    action: null,
    variant: 'primary'
  });
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showConfirmModal = (title, message, action, variant = 'primary') => {
    setModalConfig({ title, message, action, variant });
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (modalConfig.action) {
      modalConfig.action();
      let toastMessage = '';
      let toastType = 'success';

      if (modalConfig.title.includes('Delete')) {
        toastMessage = 'Feedback deleted successfully!';
        toastType = 'danger';
      } else {
        toastMessage = 'Feedback status updated!';
        toastType = 'success';
      }

      showToast(toastMessage, toastType);
    }
    setShowModal(false);
  };

  // Helper để render status tag
  const renderStatusTag = (status) => {
    if (status === 'active') return <Tag color="success" icon={<CheckOutlined />}>Active</Tag>;
    if (status === 'inactive') return <Tag color="warning" icon={<CloseOutlined />}>Inactive</Tag>;
    if (status === 'deleted') return <Tag color="error">Deleted</Tag>;
    return null;
  };

  const handleSetStatus = async (record, status) => {
    let statusText = status.charAt(0).toUpperCase() + status.slice(1);
    showConfirmModal(
      `Are you sure you want to change feedback status to "${statusText}"?`,
      `This action will change the status of the feedback.`,
      async () => {
        try {
          await updateFeedbackStatus(record._id, status);
          if (typeof record.onStatusChange === 'function') {
            record.onStatusChange();
          } else {
            window.location.reload();
          }
        } catch (error) {
          showToast('An error occurred while updating status!', 'danger');
        }
      },
      status === 'deleted' ? 'danger' : 'primary'
    );
  };

  const columns = [
    {
      title: 'Reviewer',
      dataIndex: ['userId', 'name'],
      key: 'user',
      render: (text) => (
        <Space>
          <UserOutlined />
          <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: 150 }}>{text || 'Anonymous'}</div>
        </Space>
      ),
      width: 180,
    },
    {
      title: 'Product',
      dataIndex: ['productId', 'name'],
      key: 'product',
      render: (text) => (
        <Space>
          <ShoppingOutlined />
          <Tooltip title={text || 'Unknown Product'}>
            <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: 180 }}>{text || 'Unknown Product'}</div>
          </Tooltip>
        </Space>
      ),
      width: 200,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <Space>
          <Rate disabled allowHalf value={rating || 0} />
        </Space>
      ),
      sorter: (a, b) => (a.rating || 0) - (b.rating || 0),
      width: 160,
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
      render: (text) => (
        <Tooltip title={text}>
          <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: 220 }}>{text || 'No comment'}</div>
        </Tooltip>
      ),
      width: 250,
    },
    {
      title: 'Image',
      dataIndex: 'images',
      key: 'images',
      render: (images, record) => {
        const displayImage = images?.[0] || 'https://via.placeholder.com/50x50?text=No+Img';
        if (record.rating === 4.8) {
          return (
            <Badge
              count={
                <span
                  style={{
                    backgroundColor: '#ff4d4f',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '0 6px',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}
                >
                  4.8
                </span>
              }
              offset={[-5, 5]}
            >
              <Image
                width={50}
                height={50}
                src={displayImage}
                alt="feedback"
                className="feedback-table-image"
              />
            </Badge>
          );
        } else if (images?.length > 0) {
          return (
            <Badge count={images.length} size="small" offset={[-5, 5]}>
              <Image
                width={50}
                height={50}
                src={images[0]}
                alt="feedback"
                className="feedback-table-image"
              />
            </Badge>
          );
        } else {
          return <Text type="secondary">No image</Text>;
        }
      },
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => renderStatusTag(status),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
        { text: 'Deleted', value: 'deleted' }
      ],
      onFilter: (value, record) => record.status === value,
      width: 130,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (date ? new Date(date).toLocaleDateString('en-GB') : 'N/A'),
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      defaultSortOrder: 'descend',
      width: 130,
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="small" wrap={false}>
          <Tooltip title="View details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewFeedback?.(record)}
              size="small"
            />
          </Tooltip>
          {(['active', 'deleted'].includes(record.status)) && (
            <Tooltip title="Inactive">
              <Button
                type="text"
                icon={<CloseOutlined style={{ color: 'orange' }} />}
                onClick={() => handleSetStatus(record, 'inactive')}
                size="small"
              />
            </Tooltip>
          )}
          {record.status === 'inactive' && (
            <Tooltip title="Active">
              <Button
                type="text"
                icon={<CheckOutlined style={{ color: 'green' }} />}
                onClick={() => handleSetStatus(record, 'active')}
                size="small"
              />
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleSetStatus(record, 'deleted')}
              danger
              size="small"
            />
          </Tooltip>
        </Space>
      ),
      width: 180,
      fixed: 'right',
    },
  ];

  return (
    <>
      {loading ? (
        <div className="feedback-table-loading-container">
          <Spin size="large" />
          <div className="feedback-table-loading-text">Loading data...</div>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <Empty
          description="No feedback data"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredFeedbacks}
          rowKey={(record) => record._id}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} feedbacks`
          }}
          bordered
          scroll={{ x: 1200 }}
          size="middle"
          style={{ minWidth: 1200 }}
        />
      )}

      {showModal && (
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{modalConfig.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{modalConfig.message}</Modal.Body>
          <Modal.Footer>
            <BsButton variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </BsButton>
            <BsButton variant={modalConfig.variant} onClick={handleConfirm}>
              Confirm
            </BsButton>
          </Modal.Footer>
        </Modal>
      )}

      <ToastContainer position="top-end" className="p-3" style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
        {toasts.map((toast) => (
          <Toast key={toast.id} bg={toast.type} onClose={() => removeToast(toast.id)} delay={3000} autohide>
            <Toast.Body className="text-white">{toast.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </>
  );
};

FeedbackProductTable.propTypes = {
  filteredFeedbacks: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  handleViewFeedback: PropTypes.func,
  deleteFeedback: PropTypes.func,
};

export default FeedbackProductTable;
