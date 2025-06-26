import React, { useState } from 'react';
import { UserCartProvider, useUserCart } from '../../context/UserCartContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Button, 
  InputNumber, 
  Empty, 
  notification, 
  Card, 
  Row, 
  Col, 
  Divider,
  Typography,
  Space,
  Badge,
  Avatar,
  Tag
} from 'antd';
import { 
  DeleteOutlined, 
  ShoppingCartOutlined, 
  UserOutlined,
  HeartOutlined,
  GiftOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../css/cart/user-cart.css';

const { Title, Text } = Typography;

const UserCartContent = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount } = useUserCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [updatingQuantity, setUpdatingQuantity] = useState({});

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const calculateDiscountPrice = (price, discount) => {
    const priceNumber = parseFloat(price.toString().replace(/[^\d]/g, ""));
    const result = priceNumber - (priceNumber * discount) / 100;                   
    return formatPrice(result);
  };                     

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      notification.warning({
        message: "Số lượng không hợp lệ",
        description: "Số lượng phải lớn hơn 0",
        placement: "topRight",
      });
      return;
    }
    setUpdatingQuantity((prev) => ({ ...prev, [productId]: true }));
    try {
      await updateQuantity(productId, newQuantity);
      notification.success({
        message: "Cập nhật số lượng thành công",
        placement: "topRight",
      });
    } catch (err) {
      notification.error({
        message: "Cập nhật số lượng thất bại",
        description: err?.message || "Vui lòng thử lại!",
        placement: "topRight",
      });
    } finally {
      setUpdatingQuantity((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemoveItem = (productId, productName) => {
    removeFromCart(productId);
    notification.success({
      message: "Đã xóa sản phẩm",
      description: `Đã xóa ${productName} khỏi giỏ hàng`,
      placement: "topRight",
    });
  };

  const handleClearCart = () => {
    clearCart();
    notification.success({
      message: "Đã xóa giỏ hàng",
      description: "Tất cả sản phẩm đã được xóa khỏi giỏ hàng",
      placement: "topRight",
    });
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      notification.warning({
        message: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán",
        placement: "topRight",
      });
      return;
    }
    navigate("/checkout");
  };

  const getSubtotal = () => {
    return cart.items.reduce((total, item) => {
      const price = parseFloat(item.price.toString().replace(/[^\d]/g, ""));
      return total + price * item.quantity;
    }, 0);
  };

  const getTotalDiscount = () => {
    return cart.items.reduce((total, item) => {
      const price = parseFloat(item.price.toString().replace(/[^\d]/g, ""));
      const discount = item.discount || 0;
      return total + (price * discount / 100) * item.quantity;
    }, 0);
  };

  if (cart.items.length === 0) {
    return (
      <div className="user-cart-empty">
        <Card className="empty-card">
          <Empty
            image={<ShoppingCartOutlined style={{ fontSize: 80, color: '#1890ff' }} />}
            description={
              <div>
                <Title level={4}>Giỏ hàng của bạn đang trống</Title>
                <Text type="secondary">Hãy thêm sản phẩm để bắt đầu mua sắm</Text>
              </div>
            }
          >
            <Space>
              <Button type="primary" size="large" onClick={() => navigate('/products')}>
                Tiếp tục mua sắm
              </Button>
              <Button size="large" onClick={() => navigate('/')}>
                Về trang chủ
              </Button>
            </Space>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="user-cart-container">
      {/* Header với thông tin user */}
      <Card className="user-info-card" style={{ marginBottom: 24 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <Avatar size={48} icon={<UserOutlined />} />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Xin chào, {user?.name || 'Người dùng'}!
                </Title>
                <Text type="secondary">
                  Bạn có {getCartCount()} sản phẩm trong giỏ hàng
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Badge count={getCartCount()} size="small">
                <Button 
                  type="text" 
                  icon={<ShoppingCartOutlined />}
                  onClick={() => navigate('/products')}
                >
                  Tiếp tục mua sắm
                </Button>
              </Badge>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>
        {/* Danh sách sản phẩm */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined />
                <span>Giỏ hàng của tôi ({getCartCount()} sản phẩm)</span>
              </Space>
            }
            extra={
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
                onClick={handleClearCart}
              >
                Xóa tất cả
              </Button>
            }
            className="cart-items-card"
          >
            {cart.items.map((item) => (
              <div key={item.id} className="cart-item-row">
                <Row align="middle" gutter={16}>
                  <Col xs={24} sm={6} md={4}>
                    <div className="item-image-container">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="item-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/100x100?text=Product";
                        }}
                      />
                    </div>
                  </Col>
                  
                  <Col xs={24} sm={10} md={8}>
                    <div className="item-info">
                      <Title level={5} className="item-name">{item.name}</Title>
                      <div className="item-price">
                        {item.discount > 0 ? (
                          <Space direction="vertical" size={0}>
                            <Text delete type="secondary">
                              {formatPrice(item.price)}
                            </Text>
                            <Text strong style={{ color: '#f5222d', fontSize: '16px' }}>
                              {calculateDiscountPrice(item.price, item.discount)}
                            </Text>
                            <Tag color="red" icon={<GiftOutlined />}>
                              Giảm {item.discount}%
                            </Tag>
                          </Space>
                        ) : (
                          <Text strong style={{ fontSize: '16px' }}>
                            {formatPrice(item.price)}
                          </Text>
                        )}
                      </div>
                    </div>
                  </Col>

                  <Col xs={12} sm={4} md={4}>
                    <div className="item-quantity">
                      <Text strong>Số lượng:</Text>
                      <InputNumber
                        min={1}
                        max={item.stock}
                        value={item.quantity}
                        onChange={(value) => handleQuantityChange(item.id, value)}
                        size="large"
                        style={{ width: '100%', marginTop: 8 }}
                        disabled={!!updatingQuantity[item.id]}
                      />
                    </div>
                  </Col>

                  <Col xs={12} sm={4} md={4}>
                    <div className="item-total">
                      <Text strong>Tổng:</Text>
                      <div className="total-price">
                        {item.discount > 0 
                          ? calculateDiscountPrice(item.price * item.quantity, item.discount)
                          : formatPrice(item.price * item.quantity)
                        }
                      </div>
                    </div>
                  </Col>

                  <Col xs={24} sm={4} md={4}>
                    <div className="item-actions">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        size="large"
                      >
                        Xóa
                      </Button>
                    </div>
                  </Col>
                </Row>
                <Divider />
              </div>
            ))}
          </Card>
        </Col>

        {/* Tóm tắt đơn hàng */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <SafetyCertificateOutlined />
                <span>Tóm tắt đơn hàng</span>
              </Space>
            }
            className="order-summary-card"
          >
            <div className="summary-details">
              <div className="summary-row">
                <Text>Tạm tính ({getCartCount()} sản phẩm):</Text>
                <Text>{formatPrice(getSubtotal())}</Text>
              </div>
              
              {getTotalDiscount() > 0 && (
                <div className="summary-row discount">
                  <Text type="success">Tiết kiệm:</Text>
                  <Text type="success">-{formatPrice(getTotalDiscount())}</Text>
                </div>
              )}
              
              <div className="summary-row">
                <Text>Phí vận chuyển:</Text>
                <Text type="success">Miễn phí</Text>
              </div>
              
              <Divider />
              
              <div className="summary-row total">
                <Title level={4} style={{ margin: 0 }}>Tổng cộng:</Title>
                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                  {formatPrice(getCartTotal())}
                </Title>
              </div>
            </div>

            <div className="summary-actions">
              <Button 
                type="primary" 
                size="large" 
                block
                onClick={handleCheckout}
                loading={loading}
                icon={<ShoppingCartOutlined />}
              >
                Tiến hành thanh toán
              </Button>
              
              <Button 
                type="default" 
                size="large" 
                block
                onClick={() => navigate('/products')}
                style={{ marginTop: 12 }}
              >
                Tiếp tục mua sắm
              </Button>
            </div>

            {/* Thông tin bảo mật */}
            <div className="security-info">
              <Divider />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <SafetyCertificateOutlined /> Thanh toán an toàn với SSL
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <GiftOutlined /> Miễn phí vận chuyển cho đơn hàng từ 500k
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <HeartOutlined /> Đổi trả miễn phí trong 30 ngày
                </Text>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const UserCart = () => (
  <UserCartProvider>
    <UserCartContent />
  </UserCartProvider>
);

export default UserCart; 