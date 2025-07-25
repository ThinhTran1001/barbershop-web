// OrderSuccessPayOS.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Result, Button, Typography, Spin, notification } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../../css/checkout/order-success.css';
import { getOrderByCode, updateStatusPayment, markPaymentAsPaid } from '../../services/api';
import { useUserCart } from '../../context/UserCartContext';

const { Title, Text } = Typography;

const OrderSuccessPayOS = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const { clearCart } = useUserCart();

    const hasFetched = useRef(false);

    const orderParam = params.get("orderCode");
    const success = params.get("success");
    const canceled = params.get("canceled");
    const [orderCode, setOrderCode] = useState('');

    useEffect(() => {
        if (hasFetched.current) return; // ✅ chỉ chạy 1 lần

        hasFetched.current = true;

        if (canceled) {
            navigate("/order-fail");
            return;
        }

        if (!orderParam) {
            notification.error({
                message: "Không hợp lệ",
                description: "Không tìm thấy đơn hàng hoặc trạng thái không rõ",
            });
            navigate("/");
            return;
        }

        const fullCode = 'ORD-' + orderParam;

        const fetchOrder = async () => {
            try {
                const res = await getOrderByCode(fullCode);
                const foundOrder = res.data?.order;
                setOrder(foundOrder);

                if (foundOrder && foundOrder._id) {
                    try {
                        await markPaymentAsPaid(foundOrder._id);
                    } catch (e) {
                        console.error('❌ Failed to mark payment as paid:', e);
                    }

                    clearCart(); 
                }
            } catch (error) {
                console.error(error);
                notification.error({
                    message: "Lỗi khi lấy đơn hàng",
                    description: error.response?.data?.message || "Vui lòng thử lại sau",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderParam, success, canceled, navigate, clearCart]);

    if (loading) {
        return <div style={{ padding: 80, textAlign: 'center' }}><Spin size="large" /></div>;
    }

    return (
        <div className="order-success-container">
            <Result
                status="success"
                title="Thanh toán thành công!"
                subTitle={`Đơn hàng của bạn (${order?.orderCode}) đã được ghi nhận.`}
                extra={[
                    <Button type="primary" key="orders" onClick={() => navigate("/my-orders")}>Xem đơn hàng</Button>,
                    <Button key="shop" onClick={() => navigate("/products")}>Tiếp tục mua sắm</Button>,
                ]}
            />
            <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Text strong>Tổng tiền đã thanh toán:</Text>{' '}
                <Text type="success">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order?.totalAmount || 0)}
                </Text>
            </div>
        </div>
    );
};

export default OrderSuccessPayOS;
