import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, message, Select, Tag, Space,
  Tooltip, Descriptions
} from 'antd';
import {
  getAllOrder, updateOrder, getOrderById, deleteOrder
} from '../services/api';
import {
  EditOutlined, EyeOutlined, InfoCircleFilled, DeleteFilled
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

const OrderManagement = () => {
  const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', color: 'gold' },
    { value: 'processing', label: 'Processing', color: 'orange' },
    { value: 'shipped', label: 'Shipped', color: 'blue' },
    { value: 'delivered', label: 'Delivered', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
  ];

  // Function to get allowed status transitions based on current status
  const getAllowedStatusTransitions = (currentStatus) => {
    switch (currentStatus) {
      case 'pending':
        return ['processing', 'cancelled'];
      case 'processing':
        return ['shipped'];
      case 'shipped':
        return ['delivered', 'cancelled'];
      case 'delivered':
        return []; 
      case 'cancelled':
        return []; // Cannot change status once cancelled
      default:
        return STATUS_OPTIONS.map(opt => opt.value);
    }
  };

  const [orders, setOrders] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [form] = Form.useForm();
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateSortOrder, setDateSortOrder] = useState(null);
  const [amountSortOrder, setAmountSortOrder] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 5,
    totalOrders: 0,
  });

  useEffect(() => {
    fetchInitialData();
  }, [dateSortOrder, pagination.currentPage, pagination.pageSize, searchTerm, statusFilter, amountSortOrder]);

  const fetchInitialData = async () => {
    try {
      const params = {
        sortByDate: dateSortOrder,
        page: pagination.currentPage,
        limit: pagination.pageSize,
        status: statusFilter,
        searchTerm,
        sortByAmount: amountSortOrder,
      };
      const response = await getAllOrder(params);
      setOrders(response.data.data);
      setPagination(prev => ({
        ...prev,
        totalOrders: response.data.totalOrders,
        currentPage: response.data.currentPage
      }));
    } catch (error) {
      message.error('Failed to load order list: ' + error.message);
    }
  };

  const handleUpdateOrder = async (values) => {
    try {
      // Validate status transition
      if (editingOrder && !getAllowedStatusTransitions(editingOrder.status).includes(values.status)) {
        message.error('Không thể chuyển đổi trạng thái này');
        return;
      }

      const orderData = {
        ...values,
        updatedAt: new Date().toISOString()
      };
      const response = await updateOrder(editingOrder._id, orderData);
      if ([200, 201, 204].includes(response.status)) {
        message.success('Updated order successfully');
        fetchInitialData();
        setIsModalVisible(false);
        form.resetFields();
        setEditingOrder(null);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      message.error(`Failed to update order: ${errorMessage}`);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this order?',
      okText: 'Yes',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteOrder(orderId);
          message.success('Order deleted successfully');
          fetchInitialData();
        } catch (error) {
          message.error('Failed to delete order: ' + error.message);
        }
      }
    });
  };

  const showModal = (order) => {
    setEditingOrder(order);
    form.setFieldsValue(order);
    setIsModalVisible(true);
  };

  const showViewModal = async (order) => {
    try {
      const response = await getOrderById(order._id);
      const { order: orderData, items, payment } = response.data.data;
      setViewingOrder({
        ...orderData,
        items,
        payment
      });
      setIsViewModalVisible(true);
    } catch (error) {
      message.error('Failed to fetch order details: ' + error.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return dayjs(date).format('DD/MM/YYYY HH:mm');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.color || 'default';
  };

  const columns = [
    {
      title: 'Order Code',
      dataIndex: 'orderCode',
      key: 'orderCode',
    },
    {
      title: 'Customer Name',
      key: 'customerName',
      render: (_, record) =>
        record.customerName || record.userId?.name || 'N/A',
    },
    {
      title: 'Payment Method',
      render: (_, record) => record.payment?.method?.toUpperCase() || 'N/A',
    },
    {
      title: 'Payment Status',
      render: (_, record) => {
        const status = record.payment?.status;
        const color = status === 'paid' ? 'green' : status === 'unpaid' ? 'red' : 'default';
        return <Tag color={color}>{status?.toUpperCase() || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status, record) => (
        <div>
        <Tag color={getStatusColor(status)}>{status?.toUpperCase()}</Tag>
          {getAllowedStatusTransitions(status).length === 0 && (
            <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
              {status === 'delivered' ? 'Đã hoàn thành' : status === 'cancelled' ? 'Đã hủy' : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      render: (amount) => `${amount?.toLocaleString('vi-VN')} VND`,
    },
    {
      title: 'Shipping Address',
      dataIndex: 'shippingAddress',
      render: (address) => (
        <Tooltip title={address || 'No address'}>
          <span style={{
            maxWidth: 150, display: 'inline-block', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {address || 'N/A'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Voucher Code',
      dataIndex: 'voucherId',
      render: (voucher) => voucher?.code || 'N/A',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      render: (date) => formatDate(date),
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => showViewModal(record)} />
          <Button 
            icon={<InfoCircleFilled />} 
            onClick={() => showModal(record)}
            disabled={getAllowedStatusTransitions(record.status).length === 0}
            title={getAllowedStatusTransitions(record.status).length === 0 ? 
              `Không thể thay đổi trạng thái đơn hàng ${record.status === 'delivered' ? 'đã giao' : 'đã hủy'}` : 
              'Chỉnh sửa trạng thái đơn hàng'
            }
          />
          {/* <Button icon={<DeleteFilled />} onClick={() => handleDeleteOrder(record._id)} danger /> */}
        </Space>
      ),
    },
  ];

  return (
    <div className="container mt-4">
      <Table
        dataSource={orders}
        columns={columns}
        rowKey="_id"
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageSize,
          total: pagination.totalOrders,
          onChange: (page, pageSize) => {
            setPagination(prev => ({ ...prev, currentPage: page, pageSize }));
          },
          showSizeChanger: true,
        }}
        scroll={{ x: 1200 }}
      />

      {/* View Modal */}
      <Modal
        title="Order Details"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[<Button key="back" onClick={() => setIsViewModalVisible(false)}>Close</Button>]}
        width={800}
      >
        {viewingOrder && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Order Code">{viewingOrder.orderCode}</Descriptions.Item>
              <Descriptions.Item label="Customer">{viewingOrder.customerName || viewingOrder.userId?.name || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Phone">{viewingOrder.customerPhone || viewingOrder.userId?.phone || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Email">{viewingOrder.customerEmail || viewingOrder.userId?.email || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(viewingOrder.status)}>
                  {viewingOrder.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                {typeof viewingOrder.totalAmount === 'number' 
                  ? `${viewingOrder.totalAmount.toLocaleString('vi-VN')} VND`
                  : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">{viewingOrder.payment?.method?.toUpperCase() || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <Tag color={viewingOrder.payment?.status === 'paid' ? 'green' : 'red'}>
                  {viewingOrder.payment?.status?.toUpperCase() || 'N/A'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Shipping Address" span={2}>
                {viewingOrder.shippingAddress}
              </Descriptions.Item>
              <Descriptions.Item label="Voucher Code">{viewingOrder.voucherId?.code || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Discount Amount">
                {(() => {
                  if (!viewingOrder.items || typeof viewingOrder.totalAmount !== 'number') return 'N/A';
                  const subtotal = viewingOrder.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
                  const discount = subtotal - viewingOrder.totalAmount;
                  return discount > 0 ? `${discount.toLocaleString('vi-VN')} VND` : '0 VND';
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">{formatDate(viewingOrder.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Updated At">{formatDate(viewingOrder.updatedAt)}</Descriptions.Item>
            </Descriptions>

            <h3 style={{ marginTop: 20 }}>Order Items</h3>
            <Table
              dataSource={viewingOrder.items}
              rowKey="productId"
              columns={[
                {
                  title: 'Product Image',
                  dataIndex: 'productImage',
                  render: (image, record) => (
                    <img
                      src={image || record.image || 'https://via.placeholder.com/50'}
                      alt={record.productName}
                      width={50}
                      height={50}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                    />
                  ),
                },
                { title: 'Product Name', dataIndex: 'productName' },
                { title: 'Quantity', dataIndex: 'quantity' },
                {
                  title: 'Unit Price',
                  dataIndex: 'unitPrice',
                  render: (price) => `${price.toLocaleString('vi-VN')} VND`
                }
              ]}
              pagination={false}
            />
          </>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={`Edit Order Status - ${editingOrder?.orderCode || ''}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okText="Update"
        cancelText="Cancel"
        okButtonProps={{
          disabled: editingOrder && getAllowedStatusTransitions(editingOrder.status).length === 0
        }}
      >
        <Form form={form} onFinish={handleUpdateOrder} layout="vertical">
          <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select status' }]}> 
            {editingOrder && getAllowedStatusTransitions(editingOrder.status).length > 0 ? (
              <Select optionLabelProp="children">
                {getAllowedStatusTransitions(editingOrder.status).map(status => {
                  const option = STATUS_OPTIONS.find(opt => opt.value === status);
                  return (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  );
                })}
              </Select>
            ) : (
              <Input
                value={STATUS_OPTIONS.find(opt => opt.value === editingOrder?.status)?.label || 'Pending'}
                disabled
              />
            )}
          </Form.Item>
          {editingOrder && getAllowedStatusTransitions(editingOrder.status).length === 0 && (
            <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '8px' }}>
              Không thể thay đổi trạng thái đơn hàng này. Đơn hàng đã {editingOrder.status === 'delivered' ? 'được giao' : 'bị hủy'}.
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default OrderManagement;