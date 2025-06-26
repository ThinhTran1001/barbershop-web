import React, { useState, useEffect } from 'react';
import { Spin, Alert, Typography, Tag, Button } from 'antd';
import { getAllOrder } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ListOfOrder.css';

const { Title, Text } = Typography;

const getStatusTag = (status) => {
    switch (status) {
        case 'pending':
            return <Tag color="gold">Pending</Tag>;
        case 'processing':
            return <Tag color="blue">Processing</Tag>;
        case 'shipped':
            return <Tag color="cyan">Shipped</Tag>;
        case 'delivered':
            return <Tag color="green">Delivered</Tag>;
        case 'cancelled':
            return <Tag color="red">Cancelled</Tag>;
        default:
            return <Tag>{status}</Tag>;
    }
};

const ListOfOrder = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await getAllOrder();
                setOrders(response.data.data);
            } catch (err) {
                setError('Failed to fetch orders.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [user]);

    const handleCardClick = (orderId) => {
        navigate(`/my-orders/${orderId}`);
    };

    if (loading) return <div className="spinner-container"><Spin size="large" /></div>;
    if (error) return <Alert message={error} type="error" showIcon />;

    return (
        <div className="order-list-page">
            <Title level={2} className="page-title">Lịch sử đơn hàng của bạn</Title>
            {orders.length > 0 ? (
                <div className="orders-container">
                    {orders.map(order => (
                        <div key={order._id} className="order-card" onClick={() => handleCardClick(order._id)}>
                            <div className="order-card-header">
                                <Text strong>Đơn hàng: #{order.orderCode}</Text>
                                {getStatusTag(order.status)}
                            </div>
                            <div className="order-card-body">
                                {order.items && order.items.map(item => (
                                    <div key={item._id} className="order-item-preview">
                                        <img src={item.productImage || 'https://via.placeholder.com/60'} alt={item.productName} className="item-preview-image" />
                                        <div className="item-preview-info">
                                            <Text className="item-name">{item.productName}</Text>
                                            <Text type="secondary">Số lượng: {item.quantity}</Text>
                                        </div>
                                        <Text className="item-price">{item.unitPrice.toLocaleString('vi-VN')} VND</Text>
                                    </div>
                                ))}
                            </div>
                            <div className="order-card-footer">
                                <Text>Thành tiền:</Text>
                                <Text strong className="total-amount">{order.totalAmount.toLocaleString('vi-VN')} VND</Text>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Alert message="Bạn chưa có đơn hàng nào." type="info" showIcon />
            )}
        </div>
    );
};

export default ListOfOrder; 