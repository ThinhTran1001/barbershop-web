import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrderById, updateOrder } from '../../services/api';
import {
  Spin, Alert, Button, Typography, Tag, List, Avatar, Popconfirm, message, Descriptions, Form, Input, Card, Steps, Divider, notification
} from 'antd';
import {
  ArrowLeftOutlined, CopyOutlined, CheckCircleFilled, ShoppingOutlined, CarOutlined, HomeOutlined
} from '@ant-design/icons';
import './OrderDetail.css';

const { Title, Text, Paragraph } = Typography;

const getStatusStep = (status) => {
  switch (status) {
    case 'pending': return 0;
    case 'processing': return 1;
    case 'shipped': return 2;
    case 'delivered': return 3;
    case 'cancelled': return -1;
    default: return 0;
  }
};

const steps = [
  {
    title: 'Đặt hàng thành công',
    description: 'Đơn hàng đã được xác nhận',
    icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
  },
  {
    title: 'Đang xử lý',
    description: 'Chúng tôi đang chuẩn bị đơn hàng',
    icon: <ShoppingOutlined />,
  },
  {
    title: 'Đang giao hàng',
    description: 'Đơn hàng đang được vận chuyển',
    icon: <CarOutlined />,
  },
  {
    title: 'Giao hàng thành công',
    description: 'Đơn hàng đã được giao',
    icon: <HomeOutlined />,
  },
];

const getStatusTag = (status) => {
  switch (status) {
    case 'pending': return <Tag color="gold">Chờ xác nhận</Tag>;
    case 'processing': return <Tag color="blue">Đang xử lý</Tag>;
    case 'shipped': return <Tag color="cyan">Đang giao</Tag>;
    case 'delivered': return <Tag color="green">Đã giao</Tag>;
    case 'cancelled': return <Tag color="red">Đã hủy</Tag>;
    default: return <Tag>{status}</Tag>;
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await getOrderById(id);
      const { order: orderData, items, payment } = response.data.data;
      setOrder({ ...orderData, items, payment });
    } catch (err) {
      setError('Không thể tải chi tiết đơn hàng. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleCancelOrder = async () => {
    try {
      await updateOrder(id, { status: 'cancelled' });
      message.success('Đã hủy đơn hàng thành công!');
      fetchOrderDetail();
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể hủy đơn hàng.');
    }
  };

  const handleChangeAddress = async (values) => {
    try {
      await updateOrder(id, { shippingAddress: values.shippingAddress });
      message.success('Đã cập nhật địa chỉ giao hàng!');
      fetchOrderDetail();
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể cập nhật địa chỉ.');
    }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.orderCode);
    notification.success({
      message: 'Đã sao chép mã đơn hàng',
      placement: 'topRight',
    });
  };

  if (loading) {
    return <div className="spinner-container"><Spin size="large" /></div>;
  }

  if (error) {
    return <Alert message={error} type="error" showIcon />;
  }

  if (!order) {
    return <Alert message="Không tìm thấy đơn hàng." type="warning" showIcon />;
  }

  const subtotal = order.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const discount = subtotal - order.totalAmount;

  return (
    <div className="order-success-container">
      <div className="order-success-header">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/my-orders')}
          className="back-button"
        >
          Quay lại danh sách đơn hàng
        </Button>
      </div>

      <div className="order-success-content">
        <Card className="success-card">
          <Title level={3} style={{ color: '#52c41a', marginBottom: 0 }}>Chi tiết đơn hàng</Title>
          <Paragraph style={{ marginBottom: 0 }}>Cảm ơn bạn đã mua hàng tại Barbershop!</Paragraph>
        </Card>

        <Card title="Thông tin đơn hàng" className="order-info-card">
          <div className="order-info-content">
            <div className="order-id-section">
              <div className="order-id-display">
                <Text strong>Mã đơn hàng:</Text>
                <div className="order-id-container">
                  <Text code className="order-id">{order.orderCode}</Text>
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />} 
                    onClick={copyOrderId}
                    className="copy-button"
                    title="Sao chép mã đơn hàng"
                  />
                </div>
              </div>
              <Paragraph className="order-id-note">
                Vui lòng lưu lại mã đơn hàng để tra cứu trạng thái đơn hàng
              </Paragraph>
            </div>

            <Divider />

            <div className="order-summary">
              <div className="summary-item">
                <Text>Trạng thái đơn hàng:</Text>
                {getStatusTag(order.status)}
              </div>
              <div className="summary-item">
                <Text>Phương thức thanh toán:</Text>
                <Text>{order.payment?.method?.toUpperCase() === 'CASH' ? 'Thanh toán khi nhận hàng' : (order.payment?.method?.toUpperCase() || 'N/A')}</Text>
              </div>
              <div className="summary-item">
                <Text>Trạng thái thanh toán:</Text>
                <Tag color={order.payment?.status === 'paid' ? 'green' : 'gold'}>
                  {order.payment?.status?.toUpperCase() || 'N/A'}
                </Tag>
              </div>
              <div className="summary-item">
                <Text>Địa chỉ giao hàng:</Text>
                <Text>{order.shippingAddress}</Text>
              </div>
              <div className="summary-item">
                <Text>Ngày đặt:</Text>
                <Text>{new Date(order.createdAt).toLocaleString('vi-VN')}</Text>
              </div>
              <div className="summary-item">
                <Text>Cập nhật lúc:</Text>
                <Text>{new Date(order.updatedAt).toLocaleString('vi-VN')}</Text>
              </div>
            </div>

            {order.status === 'pending' && !order.addressChanged && (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleChangeAddress}
                initialValues={{ shippingAddress: order.shippingAddress }}
                style={{ margin: '16px 0' }}
              >
                <Form.Item
                  name="shippingAddress"
                  label="Đổi địa chỉ giao hàng"
                  rules={[{ required: true, message: 'Vui lòng nhập địa chỉ mới' }]}
                >
                  <Input />
                </Form.Item>
                <Button type="primary" htmlType="submit">Cập nhật địa chỉ</Button>
              </Form>
            )}
          </div>
        </Card>

        <Card title="Trạng thái đơn hàng" className="order-status-card">
          {order.status !== 'cancelled' ? (
            <Steps
              current={getStatusStep(order.status)}
              items={steps}
              className="order-steps"
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#ff4d4f', fontWeight: 600, fontSize: 18 }}>
              Đơn hàng đã bị hủy
            </div>
          )}
          <div className="status-description">
            <Paragraph>
              <Text strong>Trạng thái :</Text> {order.status === 'pending' && 'Chúng tôi sẽ xác nhận đơn hàng và liên hệ với bạn.'}
              {order.status === 'processing' && 'Đơn hàng đang được chuẩn bị.'}
              {order.status === 'shipped' && 'Đơn hàng đang trên đường giao.'}
              {order.status === 'delivered' && 'Đơn hàng đã giao thành công.'}
              {order.status === 'cancelled' && 'Đơn hàng đã bị hủy.'}
            </Paragraph>
            {/* <Paragraph>
              <Text strong>Thời gian giao hàng dự kiến:</Text> 2-5 ngày làm việc (tùy thuộc vào địa chỉ giao hàng)
            </Paragraph> */}
          </div>
        </Card>

        <Card title="Sản phẩm trong đơn" className="order-info-card">
          <List
            itemLayout="horizontal"
            dataSource={order.items}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={item.productImage && <Avatar src={item.productImage} />}
                  title={<span className="item-name">{item.productName}</span>}
                  description={<span>Số lượng: {item.quantity}</span>}
                />
                <div className="item-price-details">
                  <Text>Đơn giá: {item.unitPrice.toLocaleString('vi-VN')} VND</Text>
                  <br />
                  <Text strong>Tổng: {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} VND</Text>
                </div>
              </List.Item>
            )}
          />
        </Card>

        <Card title="Tổng kết đơn hàng" className="order-info-card">
          <div className="order-summary">
            <div className="summary-item">
              <Text>Tổng tiền hàng:</Text>
              <Text>{subtotal.toLocaleString('vi-VN')} VND</Text>
            </div>
            {discount > 0 && (
              <div className="summary-item">
                <Text>Giảm giá voucher:</Text>
                <Text>-{discount.toLocaleString('vi-VN')} VND</Text>
              </div>
            )}
            <div className="summary-item">
              <Text>Phí vận chuyển:</Text>
              <Text>Miễn phí</Text>
            </div>
            <div className="summary-item total-amount">
              <Text strong>Thành tiền:</Text>
              <Text strong style={{ color: '#e74c3c', fontSize: 18 }}>{order.totalAmount.toLocaleString('vi-VN')} VND</Text>
            </div>
          </div>
        </Card>

        {order.status === 'pending' && (
          <div className="order-actions">
            <Popconfirm
              title="Bạn có chắc muốn hủy đơn hàng này?"
              onConfirm={handleCancelOrder}
              okText="Đồng ý"
              cancelText="Không"
            >
              <Button type="primary" danger>Hủy đơn hàng</Button>
            </Popconfirm>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
