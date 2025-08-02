import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { Button, InputNumber, Empty, notification, Checkbox, Tooltip, Spin } from 'antd';
import ToastService from '../../services/toastService';
import { DeleteOutlined, ShoppingCartOutlined, SelectOutlined, ClearOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../css/cart/cart.css';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount } = useCart();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const calculateDiscountPrice = (price, discount) => {
    const priceNumber = parseFloat(price.toString().replace(/[^\d]/g, ""));
    const result = priceNumber * (1 - Number(discount) / 100);
    return formatPrice(result);
  };

  // Handle individual item selection
  const handleItemSelect = (itemId, checked) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Handle select all items
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(new Set(cart.items.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  // Get selected items total
  const getSelectedItemsTotal = () => {
    return cart.items
      .filter(item => selectedItems.has(item.id))
      .reduce((total, item) => {
        const itemPrice = Number(item.discount) > 0 
          ? parseFloat(item.price.toString().replace(/[^\d]/g, "")) * (1 - Number(item.discount) / 100)
          : item.price;
        return total + (itemPrice * item.quantity);
      }, 0);
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedItems.size === 0) {
      notification.warning({
        message: "Chưa chọn sản phẩm",
        description: "Vui lòng chọn ít nhất một sản phẩm để xóa",
        placement: "topRight",
      });
      return;
    }

    const selectedItemNames = cart.items
      .filter(item => selectedItems.has(item.id))
      .map(item => item.name)
      .join(", ");

    setConfirmDialog({
      show: true,
      title: 'Xác nhận xóa sản phẩm',
      message: `Bạn có muốn xóa ${selectedItems.size} sản phẩm đã chọn khỏi giỏ hàng không?\n\nSản phẩm: ${selectedItemNames}`,
      onConfirm: () => {
        setLoading(true);
        setTimeout(() => {
          selectedItems.forEach(itemId => {
            removeFromCart(itemId);
          });
          setSelectedItems(new Set());
          setLoading(false);
          notification.success({
            message: "Đã xóa sản phẩm",
            description: `Đã xóa ${selectedItems.size} sản phẩm khỏi giỏ hàng`,
            placement: "topRight",
          });
          setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
        }, 500);
      }
    });
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      notification.warning({
        message: "Số lượng không hợp lệ",
        description: "Số lượng phải lớn hơn 0",
        placement: "topRight",
      });
      return;
    }
    
    const item = cart.items.find(item => item.id === productId);
    if (item && newQuantity > item.stock) {
      ToastService.showQuantityLimitExceeded(item.stock);
      return;
    }
    
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId, productName) => {
    console.log('🔍 handleRemoveItem called with:', { productId, productName });
    
    setConfirmDialog({
      show: true,
      title: 'Xác nhận xóa sản phẩm',
      message: `Bạn có muốn xóa sản phẩm "${productName}" khỏi giỏ hàng không?`,
      onConfirm: () => {
        console.log('✅ User confirmed delete for:', productName);
        removeFromCart(productId);
        // Remove from selected items if it was selected
        const newSelected = new Set(selectedItems);
        newSelected.delete(productId);
        setSelectedItems(newSelected);
        
        notification.success({
          message: "Đã xóa sản phẩm",
          description: `Đã xóa ${productName} khỏi giỏ hàng`,
          placement: "topRight",
        });
        setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleClearCart = () => {
    console.log('🔍 handleClearCart called');
    
    setConfirmDialog({
      show: true,
      title: 'Xác nhận xóa giỏ hàng',
      message: 'Bạn có muốn xóa tất cả sản phẩm khỏi giỏ hàng không?',
      onConfirm: () => {
        console.log('✅ User confirmed clear cart');
        setLoading(true);
        setTimeout(() => {
          clearCart();
          setSelectedItems(new Set());
          setLoading(false);
          notification.success({
            message: "Đã xóa giỏ hàng",
            description: "Tất cả sản phẩm đã được xóa khỏi giỏ hàng",
            placement: "topRight",
          });
          setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
        }, 500);
      }
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
    
    // Kiểm tra xem có sản phẩm nào được chọn không
    if (selectedItems.size === 0) {
      notification.warning({
        message: "Chưa chọn sản phẩm",
        description: "Vui lòng chọn ít nhất một sản phẩm để thanh toán",
        placement: "topRight",
      });
      return;
    }
    
    notification.info({
      message: "Thanh toán sản phẩm đã chọn",
      description: `Sẽ thanh toán ${selectedItems.size} sản phẩm đã chọn`,
      placement: "topRight",
    });
    
    navigate("/checkout-guest");
  };

  if (cart.items.length === 0) {
    return (
      <div className="cart-empty-container">
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description="Giỏ hàng của bạn đang trống"
        >
          <Button type="primary" onClick={() => window.history.back()}>
            Tiếp tục mua sắm
          </Button>
        </Empty>
      </div>
    );
  }

  const allSelected = cart.items.length > 0 && selectedItems.size === cart.items.length;
  const someSelected = selectedItems.size > 0 && selectedItems.size < cart.items.length;

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Giỏ hàng ({getCartCount()} sản phẩm)</h1>
        <div className="cart-header-actions">
          {selectedItems.size > 0 && (
            <Button 
              type="primary" 
              danger 
              icon={<DeleteOutlined />}
              onClick={handleBulkDelete}
              className="bulk-delete-btn"
            >
              Xóa đã chọn ({selectedItems.size})
            </Button>
          )}
          <Button 
            type="text" 
            danger 
            icon={<ClearOutlined />}
            onClick={handleClearCart}
          >
            Xóa tất cả
          </Button>
        </div>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {/* Bulk Selection Header */}
          <div className="bulk-selection-header">
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              <span className="select-all-text">
                {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </span>
            </Checkbox>
            {selectedItems.size > 0 && (
              <span className="selected-count">
                Đã chọn {selectedItems.size}/{cart.items.length} sản phẩm
              </span>
            )}
          </div>

          <Spin spinning={loading}>
            {cart.items.map((item) => (
              <div key={item.id} className={`cart-item ${selectedItems.has(item.id) ? 'selected' : ''}`}>
                <div className="item-checkbox">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                  />
                </div>
                
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
                  <h3 className="item-name">{item.name}</h3>
                  <div className="item-price">
                    {Number(item.discount) > 0 ? (
                      <>
                        <span className="original-price">{formatPrice(item.price)}</span>
                        <span className="discounted-price">
                          {calculateDiscountPrice(item.price, item.discount)}
                        </span>
                      </>
                    ) : (
                      <span className="current-price">{formatPrice(item.price)}</span>
                    )}
                  </div>
                </div>

                <div className="item-quantity">
                  <span className="quantity-label">Số lượng:</span>
                  <InputNumber
                    min={1}
                    max={item.stock}
                    value={item.quantity}
                    onChange={(value) => {
                      // Chỉ xử lý khi value là số hợp lệ và >= 1
                      if (value && typeof value === 'number' && value >= 1) {
                        // Kiểm tra nếu nhập quá stock thì tự động điều chỉnh về stock
                        if (value > item.stock) {
                          // Cập nhật quantity về stock tối đa
                          updateQuantity(item.id, item.stock);
                          notification.info({
                            message: 'Số lượng đã được điều chỉnh',
                            description: `Số lượng tối đa có sẵn là ${item.stock}`,
                            placement: 'topRight',
                          });
                        } else {
                          handleQuantityChange(item.id, value);
                        }
                      }
                    }}
                    onKeyPress={(e) => {
                      // Chỉ cho phép nhập số từ 0-9
                      const charCode = e.which ? e.which : e.keyCode;
                      if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>

                <div className="item-total">
                  <span className="total-label">Tổng:</span>
                  <span className="total-price">
                    {Number(item.discount) > 0
                      ? calculateDiscountPrice(item.price * item.quantity, item.discount)
                      : formatPrice(item.price * item.quantity)
                    }
                  </span>
                </div>

                <div className="item-actions">
                  <Tooltip title="Xóa sản phẩm">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveItem(item.id, item.name)}
                    >
                      Xóa
                    </Button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </Spin>
        </div>

        <div className="cart-summary">
          <div className="summary-header">
            <h3>Tổng đơn hàng</h3>
          </div>
          
          <div className="summary-details">
            <div className="summary-row">
              <span>Tạm tính:</span>
              <span>
                {selectedItems.size > 0 
                  ? formatPrice(getSelectedItemsTotal())
                  : formatPrice(getCartTotal())
                }
              </span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển:</span>
              <span>Miễn phí</span>
            </div>
            <div className="summary-row total">
              <span>Tổng cộng:</span>
              <span>
                {selectedItems.size > 0 
                  ? formatPrice(getSelectedItemsTotal())
                  : formatPrice(getCartTotal())
                }
              </span>
            </div>
            {/* {selectedItems.size > 0 && (
              <div className="summary-note">
                <small>Chỉ tính cho {selectedItems.size} sản phẩm đã chọn</small>
              </div>
            )} */}
          </div>

          <div className="summary-actions">
            <Button 
              type="primary" 
              size="large" 
              block
              onClick={handleCheckout}
              disabled={selectedItems.size === 0}
            >
              {selectedItems.size > 0 
                ? `Thanh toán ${selectedItems.size} sản phẩm`
                : 'Tiến hành thanh toán'
              }
            </Button>
            <Button 
              type="default" 
              size="large" 
              block
              onClick={() => window.history.back()}
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        </div>
      </div>
      
      {/* Custom Confirm Dialog */}
      {confirmDialog.show && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h3>{confirmDialog.title}</h3>
            <p>{confirmDialog.message}</p>
            <div className="confirm-dialog-actions">
              <Button 
                onClick={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null })}
              >
                Hủy
              </Button>
              <Button 
                type="primary" 
                danger
                onClick={confirmDialog.onConfirm}
              >
                Đồng ý
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart; 