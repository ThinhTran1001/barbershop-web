import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById, updateOrder } from '../../services/api';
import { Spin, Alert, Button, Typography, Tag, List, Avatar, Popconfirm, message, Descriptions } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import './OrderDetail.css';

const { Title, Text } = Typography;

const getStatusTag = (status) => {
    // ... (same as in ListOfOrder)
    switch (status) {
        case 'pending': return <Tag color="gold">Pending</Tag>;
        case 'processing': return <Tag color="blue">Processing</Tag>;
        case 'shipped': return <Tag color="cyan">Shipped</Tag>;
        case 'delivered': return <Tag color="green">Delivered</Tag>;
        case 'cancelled': return <Tag color="red">Cancelled</Tag>;
        default: return <Tag>{status}</Tag>;
    }
};

const OrderDetail = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            fetchOrderDetail(); // Refresh the details
        } catch (err) {
            message.error(err.response?.data?.message || 'Không thể hủy đơn hàng.');
        }
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
        <div className="order-detail-container">
            <Link to="/my-orders" className="back-link">
                <ArrowLeftOutlined /> Quay lại danh sách đơn hàng
            </Link>

            <Title level={2} style={{ marginTop: '20px' }}>Chi tiết đơn hàng</Title>
            
            <div className="order-detail-card">
                <Descriptions title="Thông tin chung" column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}>
                    <Descriptions.Item label="Mã đơn hàng">{order.orderCode}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">{getStatusTag(order.status)}</Descriptions.Item>
                    <Descriptions.Item label="Phương thức thanh toán">{order.payment?.method?.toUpperCase() || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái thanh toán">
                        <Tag color={order.payment?.status === 'paid' ? 'green' : 'gold'}>
                            {order.payment?.status?.toUpperCase() || 'N/A'}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ giao hàng" span={2}>{order.shippingAddress}</Descriptions.Item>
                    <Descriptions.Item label="Ngày đặt">{new Date(order.createdAt).toLocaleString('vi-VN')}</Descriptions.Item>
                    <Descriptions.Item label="Cập nhật lúc">{new Date(order.updatedAt).toLocaleString('vi-VN')}</Descriptions.Item>
                </Descriptions>

                <div className="order-items-section">
                    <Title level={5} style={{ marginBottom: '16px' }}>Sản phẩm trong đơn</Title>
                    <List
                        itemLayout="horizontal"
                        dataSource={order.items}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={item.productImage && <Avatar src={item.productImage} />}
                                    title={<Link to={`/product/${item.productId}`} target="_blank" rel="noopener noreferrer">{item.productName}</Link>}
                                    description={`Số lượng: ${item.quantity}`}
                                />
                                <div className="item-price-details">
                                    <Text>Đơn giá: {item.unitPrice.toLocaleString('vi-VN')} VND</Text>
                                </div>
                            </List.Item>
                        )}
                    />
                </div>

                <div className="order-summary">
                    <div className="summary-row">
                        <Text>Tổng tiền hàng</Text>
                        <Text>{subtotal.toLocaleString('vi-VN')} VND</Text>
                    </div>
                    {discount > 0 && (
                        <div className="summary-row">
                            <Text>Giảm giá voucher</Text>
                            <Text>-{discount.toLocaleString('vi-VN')} VND</Text>
                        </div>
                    )}
                    <div className="summary-row final-total">
                        <Text strong>Thành tiền</Text>
                        <Title level={4} className="final-total-amount">{order.totalAmount.toLocaleString('vi-VN')} VND</Title>
                    </div>
                </div>

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
