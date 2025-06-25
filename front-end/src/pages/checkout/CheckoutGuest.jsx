import React, { useState } from 'react';
import { Button, Form, Input, Card, Divider, notification, Empty, Select } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { TextArea } = Input;

const CheckoutGuest = () => {
  const { cart, clearCart, getCartTotal } = useCart();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowItems = location.state?.products;
  const itemsToCheckout = buyNowItems && buyNowItems.length > 0 ? buyNowItems : cart.items;

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Ở đây bạn có thể gửi dữ liệu lên backend nếu muốn
      // Hiện tại chỉ hiển thị thông báo thành công và xóa cart local
      setOrderSuccess(true);
      clearCart();
      notification.success({
        message: 'Đặt hàng thành công!',
        description: 'Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ sớm.',
        placement: 'topRight',
      });
    } catch (error) {
      notification.error({
        message: 'Lỗi đặt hàng',
        description: 'Vui lòng thử lại sau!',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotal = () => {
    return itemsToCheckout.reduce((sum, item) => {
      const price = item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price;
      return sum + price * item.quantity;
    }, 0);
  };

  if (orderSuccess) {
    return (
      <div className="checkout-empty">
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description="Đặt hàng thành công!"
        >
          <Button type="primary" onClick={() => navigate('/')}>Về trang chủ</Button>
        </Empty>
      </div>
    );
  }

  if (!itemsToCheckout || itemsToCheckout.length === 0) {
    return (
      <div className="checkout-empty">
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description="Không có sản phẩm để thanh toán"
        >
          <Button type="primary" onClick={() => navigate('/products')}>Tiếp tục mua sắm</Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Thanh toán (Không cần đăng nhập)</h1>
      </div>
      <div className="checkout-content">
        <div className="checkout-form-section">
          <Card title="Thông tin giao hàng" className="checkout-card">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>
              <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}>
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ!' }]}>
                <Input placeholder="Nhập email" />
              </Form.Item>
              <Form.Item name="address" label="Địa chỉ giao hàng" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}>
                <TextArea placeholder="Nhập địa chỉ chi tiết" rows={3} />
              </Form.Item>
              <Form.Item name="paymentMethod" label="Phương thức thanh toán" rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán!' }]}>
                <Select placeholder="Chọn phương thức">
                  <Select.Option value="cash">Thanh toán khi nhận hàng</Select.Option>
                  <Select.Option value="bank">Chuyển khoản ngân hàng</Select.Option>
                  <Select.Option value="momo">Ví MoMo</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" loading={loading} block>
                  Đặt hàng ngay
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
        <div className="checkout-summary-section">
          <Card title="Đơn hàng của bạn" className="checkout-card">
            <div className="checkout-products-list">
              <div className="checkout-products-header">
                <div>Ảnh</div>
                <div>Tên sản phẩm</div>
                <div>Số lượng</div>
                <div>Giá</div>
              </div>
              {itemsToCheckout.map((item, index) => (
                <div key={index} className="checkout-product-row">
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
};

export default CheckoutGuest; 