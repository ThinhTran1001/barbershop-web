// OrderSuccessPayOS.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Result, Button, Typography, Spin, notification } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../../css/checkout/order-success.css';
import { finalizeOrder, markPaymentAsPaid } from '../../services/api';
import { useUserCart } from '../../context/UserCartContext';

const { Text } = Typography;

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

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        if (canceled) {
            navigate("/order-fail");
            return;
        }

        if (!orderParam || !success) {
            notification.error({ message: "Thanh toán không hợp lệ" });
            return;
        }

        const finalize = async () => {
            try {
                const pending = JSON.parse(localStorage.getItem("pendingOrder"));
                console.log();

                if (!pending || !pending.orderCode || !pending.orderData) {
                    throw new Error("Không có thông tin đơn hàng trong localStorage");
                }

                let res;
                if (pending.userId) {
                    res = await finalizeOrder(pending.orderCode, pending.orderData, pending.userId);
                    clearCart();
                } else {
                    res = await finalizeOrder(pending.orderCode, pending.orderData);
                }

                const savedOrder = res.data?.order;
                await markPaymentAsPaid(savedOrder._id);


                localStorage.removeItem("pendingOrder");
                setOrder(savedOrder);
            } catch (err) {
                console.error("Lỗi finalize:", err);
                notification.error({ message: "Lỗi xử lý đơn hàng", description: err.message });
            } finally {
                setLoading(false);
            }
        };
        
        finalize();
    }, [navigate, success, orderParam, canceled, clearCart]);

    if (loading) {
        return (
            <div style={{ padding: 80, textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="order-success-container">
            <Result
                status="success"
                title="Thanh toán thành công!"
                subTitle={`Đơn hàng của bạn (${order?.orderCode}) đã được ghi nhận.`}
                extra={[
                    <Button type="primary" key="orders" onClick={() => navigate("/my-orders")}>
                        Xem đơn hàng
                    </Button>,
                    <Button key="shop" onClick={() => navigate("/products")}>
                        Tiếp tục mua sắm
                    </Button>,
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
