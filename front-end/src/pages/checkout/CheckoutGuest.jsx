// src/pages/checkout/CheckoutGuest.jsx
import React, { useState } from 'react';
import {
  Button,
  Form,
  Input,
  Card,
  Divider,
  notification,
  Empty,
  Select
} from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { createOrderGuest } from '../../services/api';   // ✅ dùng chung API
import '../../css/checkout/checkout.css';

const { TextArea } = Input;
const { Option } = Select;

export default function CheckoutGuest() {
  const { cart, clearCart } = useCart();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  /* ------------------ Lấy danh sách sản phẩm cần thanh toán ------------------ */
  const buyNowItems = location.state?.products;
  const itemsToCheckout = buyNowItems?.length ? buyNowItems : cart.items;

  /* ------------------ Helper ------------------ */
  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const getTotal = () =>
    itemsToCheckout.reduce((sum, item) => {
      const raw = item.price ?? item.product?.price ?? 0;
      const disc = item.discount ?? item.product?.discount ?? 0;
      const price = disc ? raw * (1 - disc / 100) : raw;
      return sum + price * item.quantity;
    }, 0);

  /* ------------------ Submit ------------------ */
  const handleSubmit = async (values) => {
    if (!itemsToCheckout.length) {
      notification.warning({
        message: 'Giỏ hàng trống',
        description: 'Vui lòng thêm sản phẩm trước khi thanh toán',
        placement: 'topRight'
      });
      return;
    }

    setLoading(true);
    try {
      const orderItems = itemsToCheckout.map((i) => ({
        productId: i.productId || i.id || i._id || i.product?._id,
        quantity: i.quantity
      }));

      const orderData = {
        // Thông tin khách (login rồi thì backend sẽ tự lấy userId trong token)
        customerName: values.name,
        customerEmail: values.email,
        customerPhone: values.phone,
        shippingAddress: values.address,
        paymentMethod: values.paymentMethod,
        items: orderItems
      };

      await createOrderGuest(orderData);               // ✅ gọi chung API

      if (!buyNowItems?.length) clearCart();      // Xoá cart local khi thanh toán từ giỏ
      setOrderSuccess(true);

      notification.success({
        message: 'Đặt hàng thành công!',
        description: 'Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ sớm.',
        placement: 'topRight'
      });
    } catch (err) {
      notification.error({
        message: 'Lỗi đặt hàng',
        description: err.response?.data?.message || 'Vui lòng thử lại sau!',
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ UI khi thành công ------------------ */
  if (orderSuccess) {
    return (
      <div className="checkout-empty">
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description="Đặt hàng thành công!"
        >
          <Button type="primary" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        </Empty>
      </div>
    );
  }

  /* ------------------ UI khi không có sản phẩm ------------------ */
  if (!itemsToCheckout.length) {
    return (
      <div className="checkout-empty">
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description="Không có sản phẩm để thanh toán"
        >
          <Button type="primary" onClick={() => navigate('/products')}>
            Tiếp tục mua sắm
          </Button>
        </Empty>
      </div>
    );
  }

  /* ------------------ Giao diện chính ------------------ */
  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Thanh toán (khách không đăng nhập)</h1>
      </div>

      <div className="checkout-content">
        {/* FORM THÔNG TIN KHÁCH */}
        <div className="checkout-form-section">
          <Card title="Thông tin giao hàng" className="checkout-card">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="name"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải đủ 10 chữ số' }
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>

              <Form.Item
                name="address"
                label="Địa chỉ giao hàng"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
              >
                <TextArea placeholder="Nhập địa chỉ chi tiết" rows={3} />
              </Form.Item>

              <Form.Item
                name="paymentMethod"
                label="Phương thức thanh toán"
                rules={[{ required: true, message: 'Vui lòng chọn phương thức!' }]}
              >
                <Select placeholder="Chọn phương thức">
                  <Option value="cash">Thanh toán khi nhận hàng</Option>
                  <Option value="bank">Chuyển khoản ngân hàng</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  block
                >
                  Đặt hàng ngay
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>

        {/* TÓM TẮT ĐƠN HÀNG */}
        <div className="checkout-summary-section">
          <Card title="Đơn hàng của bạn" className="checkout-card">
            <div className="checkout-products-list">
              <div className="checkout-products-header">
                <div>Ảnh</div>
                <div>Tên sản phẩm</div>
                <div>Số lượng</div>
                <div>Giá</div>
              </div>

              {itemsToCheckout.map((item, idx) => (
                <div key={idx} className="checkout-product-row">
                  <div className="checkout-product-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="checkout-product-name">{item.name}</div>
                  <div className="checkout-product-quantity">x{item.quantity}</div>
                  <div className="checkout-product-price">
                    {item.discount > 0 ? (
                      <>
                        <span className="original-price">{formatPrice(item.price)}</span>
                        <span className="discounted-price">
                          {formatPrice(item.price * (1 - item.discount / 100))}
                        </span>
                      </>
                    ) : (
                      <span className="current-price">{formatPrice(item.price)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Divider />

            <div className="order-summary">
              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{formatPrice(getTotal())}</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>Miễn phí</span>
              </div>
              <div className="summary-row total">
                <strong>Tổng cộng:</strong>
                <strong>{formatPrice(getTotal())}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
