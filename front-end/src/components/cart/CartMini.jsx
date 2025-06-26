import React from 'react';
import { useCart } from '../../context/CartContext';
import { Button, Empty, notification } from 'antd';
import { ShoppingCartOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../css/cart/cart-mini.css';

const CartMini = () => {
  const { cart, removeFromCart, getCartCount, getCartTotal, isLoggedIn } = useCart();
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
      notification.warning({
        message: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán",
        placement: "topRight",
      });
      return;
    }

    // Điều hướng dựa trên trạng thái đăng nhập
    if (isLoggedIn) {
      // User đã đăng nhập - chuyển đến checkout bình thường
      navigate("/checkout");
      notification.info({
        message: "Chuyển đến trang thanh toán",
        description: "Vui lòng hoàn tất thông tin thanh toán",
        placement: "topRight",
      });
    } else {
      // User chưa đăng nhập - chuyển đến checkout guest
      navigate("/checkout-guest");
      notification.info({
        message: "Chuyển đến trang thanh toán khách",
        description: "Vui lòng nhập thông tin cá nhân để thanh toán",
        placement: "topRight",
      });
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="cart-mini-empty">
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />}
          description="Giỏ hàng trống"
          style={{ padding: '20px' }}
        />
      </div>
    );
  }

  return (
    <div className="cart-mini">
      <div className="cart-mini-header">
        <h4>Giỏ hàng ({getCartCount()} sản phẩm)</h4>
      </div>
      
      <div className="cart-mini-items">
        {cart.items.slice(0, 3).map((item) => (
          <div key={item.id} className="cart-mini-item">
            <div className="item-image">
              <img 
                src={item.image} 
                alt={item.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "";
                }}
              />
            </div>
            
            <div className="item-info">
              <h5 className="item-name">{item.name}</h5>
              <div className="item-price">
                {item.discount > 0 ? (
                  <span className="discounted-price">
                    {calculateDiscountPrice(item.price, item.discount)}
                  </span>
                ) : (
                  <span className="current-price">{formatPrice(item.price)}</span>
                )}
              </div>
              <div className="item-quantity">Số lượng: {item.quantity}</div>
            </div>

            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveItem(item.id)}
              className="remove-btn"
            />
          </div>
        ))}
        
        {cart.items.length > 3 && (
          <div className="cart-mini-more">
            <span>Và {cart.items.length - 3} sản phẩm khác...</span>
          </div>
        )}
      </div>

      <div className="cart-mini-footer">
        <div className="cart-mini-total">
          <span>Tổng cộng:</span>
          <span className="total-price">{formatPrice(getCartTotal())}</span>
        </div>
        
        <div className="cart-mini-actions">
          <Button 
            type="default" 
            size="small"
            onClick={() => navigate("/cart")}
          >
            Xem giỏ hàng
          </Button>
          <Button 
            type="primary" 
            size="small"
            onClick={() => navigate("/cart")}
          >
            Thanh toán
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartMini; 