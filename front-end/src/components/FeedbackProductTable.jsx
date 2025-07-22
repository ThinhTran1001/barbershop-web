import React, { useState } from 'react';
import { Table, Space, Tag, Image, Tooltip, Button, Spin, Empty, Typography, Badge, Rate } from 'antd';
import {
  UserOutlined, ShoppingOutlined, EyeOutlined, DeleteOutlined,
  CheckOutlined, CloseOutlined
} from '@ant-design/icons';
import PropTypes from 'prop-types';

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
      }

      showToast(toastMessage, toastType);
    }
    setShowModal(false);
  };

  const columns = [
    {
      title: 'Reviewer',
      dataIndex: ['userId', 'name'],
      key: 'user',
      render: (text) => (
        <Space>
          <UserOutlined />
          <Text>{text || 'Anonymous'}</Text>
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
            <Text ellipsis className="feedback-table-product-name">
              {text || 'Unknown Product'}
            </Text>
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
          <Text ellipsis className="feedback-table-comment">{text || 'No comment'}</Text>
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
      dataIndex: 'isDeleted',
      key: 'isDeleted',
      render: (deleted) =>
        deleted ? (
          <Tag color="error" icon={<CloseOutlined />}>Deleted</Tag>
        ) : (
          <Tag color="success" icon={<CheckOutlined />}>Active</Tag>
        ),
      filters: [
        { text: 'Active', value: false },
        { text: 'Deleted', value: true }
      ],
      onFilter: (value, record) => record.isDeleted === value,
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



          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => showConfirmModal(
                'Delete Feedback',
                'Are you sure you want to delete this feedback?',
                () => deleteFeedback?.(record._id),
                'danger'
              )}
              danger
              size="small"
            />
          </Tooltip>
        </Space>
      ),
      width: 160,
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
          scroll={{ x: 1000 }}
          size="middle"
        />
      )}

      {showModal && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowModal(false)}
          ></div>

          <div
            className="modal fade show"
            style={{ display: 'block' }}
            tabIndex="-1"
            onClick={() => setShowModal(false)}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{modalConfig.title}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>{modalConfig.message}</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    className={`btn btn-${modalConfig.variant}`}
                    onClick={handleConfirm}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast show align-items-center text-bg-${toast.type} border-0`}
            role="alert"
          >
            <div className="d-flex">
              <div className="toast-body">
                {toast.message}
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => removeToast(toast.id)}
              ></button>
            </div>
          </div>
        ))}
      </div>
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
