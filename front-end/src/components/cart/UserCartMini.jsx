import React from 'react';
import { UserCartProvider, useUserCart } from '../../context/UserCartContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Button, 
  Empty, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Space, 
  Badge,
  Avatar,
  Divider
} from 'antd';
import { 
  ShoppingCartOutlined, 
  DeleteOutlined, 
  UserOutlined,
  HeartOutlined,
  GiftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../css/cart/user-cart-mini.css';

const { Title, Text } = Typography;

const UserCartMiniContent = () => {
  const { cart, removeFromCart, getCartCount, getCartTotal } = useUserCart();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      return;
    }
    navigate("/checkout");
  };

  if (cart.items.length === 0) {
    return (
      <div className="user-cart-mini-empty">
        <Card className="empty-card">
          <Empty
            image={<ShoppingCartOutlined style={{ fontSize: 48, color: '#1890ff' }} />}
            description={
              <div>
                <Title level={5}>Giỏ hàng trống</Title>
                <Text type="secondary">Hãy thêm sản phẩm để bắt đầu mua sắm</Text>
              </div>
            }
            style={{ padding: '20px' }}
          />
          <div className="empty-actions">
            <Button type="primary" block onClick={() => navigate('/products')}>
              Tiếp tục mua sắm
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="user-cart-mini">
      {/* Header với thông tin user */}
      <div className="user-cart-mini-header">
        <Card className="user-info-card">
          <Row align="middle" gutter={12}>
            <Col>
              <Avatar size={32} icon={<UserOutlined />} />
            </Col>
            <Col flex="auto">
              <div>
                <Text strong style={{ color: 'white' }}>
                  {user?.name || 'Người dùng'}
                </Text>
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                    {getCartCount()} sản phẩm trong giỏ
                  </Text>
                </div>
              </div>
            </Col>
            <Col>
              <Badge count={getCartCount()} size="small">
                <ShoppingCartOutlined style={{ color: 'white', fontSize: '18px' }} />
              </Badge>
            </Col>
          </Row>
        </Card>
      </div>
      
      {/* Danh sách sản phẩm */}
      <div className="user-cart-mini-items">
        <Card className="items-card">
          {cart.items.slice(0, 3).map((item) => (
            <div key={item.id} className="user-cart-mini-item">
              <Row align="middle" gutter={12}>
                <Col span={6}>
                  <div className="item-image-container">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="item-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/60x60?text=Product";
                      }}
                    />
                  </div>
                </Col>
                
                <Col span={14}>
                  <div className="item-info">
                    <Title level={5} className="item-name">{item.name}</Title>
                    <div className="item-price">
                      {item.discount > 0 ? (
                        <Space direction="vertical" size={0}>
                          <Text delete type="secondary" style={{ fontSize: '12px' }}>
                            {formatPrice(item.price)}
                          </Text>
                          <Text strong style={{ color: '#f5222d', fontSize: '14px' }}>
                            {calculateDiscountPrice(item.price, item.discount)}
                          </Text>
                        </Space>
                      ) : (
                        <Text strong style={{ fontSize: '14px' }}>
                          {formatPrice(item.price)}
                        </Text>
                      )}
                    </div>
                    <div className="item-quantity">
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Số lượng: {item.quantity}
                      </Text>
                    </div>
                  </div>
                </Col>

                <Col span={4}>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveItem(item.id)}
                    className="remove-btn"
                  />
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
            </div>
          ))}
          
          {cart.items.length > 3 && (
            <div className="user-cart-mini-more">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Và {cart.items.length - 3} sản phẩm khác...
              </Text>
            </div>
          )}
        </Card>
      </div>

      {/* Footer với tổng tiền và actions */}
      <div className="user-cart-mini-footer">
        <Card className="footer-card">
          <div className="user-cart-mini-total">
            <Row justify="space-between" align="middle">
              <Col>
                <Text strong>Tổng cộng:</Text>
              </Col>
              <Col>
                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                  {formatPrice(getCartTotal())}
                </Title>
              </Col>
            </Row>
          </div>
          
          <div className="user-cart-mini-actions">
            <Button 
              type="default" 
              size="small"
              block
              onClick={() => navigate("/cart")}
              style={{ marginBottom: 8 }}
            >
              Xem giỏ hàng
            </Button>
            <Button 
              type="primary" 
              size="small"
              block
              onClick={handleCheckout}
              icon={<ShoppingCartOutlined />}
            >
              Thanh toán
            </Button>
          </div>

          {/* Thông tin bảo mật */}
          <div className="security-info">
            <Divider style={{ margin: '12px 0' }} />
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: '10px' }}>
                <GiftOutlined /> Miễn phí vận chuyển
              </Text>
              <Text type="secondary" style={{ fontSize: '10px' }}>
                <HeartOutlined /> Đổi trả 30 ngày
              </Text>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
};

const UserCartMini = () => (
  <UserCartProvider>
    <UserCartMiniContent />
  </UserCartProvider>
);

export default UserCartMini; 