import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { Button, InputNumber, Empty, notification, Checkbox, Tooltip, Spin, Tag } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, ClearOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../css/cart/cart.css';

// Custom Warning Toast Component for out of stock items
const CustomWarningToast = ({ show, message, onClose }) => {
  if (!show) return null;

  return (
    <div 
      className="custom-toast-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div 
        className="custom-toast"
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div style={{ marginBottom: '15px' }}>
          <div 
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#ff4d4f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            <svg 
              width="30" 
              height="30" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="3"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
        </div>
        
        {/* Message */}
        <h4 style={{ 
          margin: '0 0 10px 0', 
          color: '#333',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Không thể thanh toán
        </h4>
        <p style={{ 
          margin: '0 0 15px 0', 
          color: '#666',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          {message}
        </p>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#ff4d4f',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#ff7875'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#ff4d4f'}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount, syncStock } = useCart();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Custom warning toast state (giống UserCart)
  const [warningToast, setWarningToast] = useState({
    show: false,
    message: ''
  });

  const [originalQuantities, setOriginalQuantities] = useState({});

  // Sync stock when component mounts
  useEffect(() => {
    const syncData = async () => {
      if (cart.items.length > 0) {
        setSyncing(true);
        await syncStock();
        setSyncing(false);
      }
    };
    
    syncData();
  }, []);

  // Lưu số lượng gốc khi user bắt đầu thay đổi quantity
  const handleQuantityFocus = (productId, currentQuantity) => {
    setOriginalQuantities(prev => ({
      ...prev,
      [productId]: currentQuantity
    }));
  };

  // Show custom warning toast (giống UserCart)
  const showWarningToast = (message) => {
    setWarningToast({
      show: true,
      message
    });
    
    // Auto hide after 4 seconds
    setTimeout(() => {
      hideWarningToast();
    }, 4000);
  };

  // Hide custom warning toast
  const hideWarningToast = () => {
    setWarningToast(prev => ({ ...prev, show: false }));
  };

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

  // Kiểm tra sản phẩm có hết hàng không
  const isOutOfStock = (item) => {
    // Check cả stock và validation status
    return item.stock <= 0 || item.isValid === false;
  };

  // Handle individual item selection
  const handleItemSelect = (itemId, checked) => {
    // Không cho phép chọn sản phẩm hết hàng
    const item = cart.items.find(item => item.id === itemId);
    if (item && isOutOfStock(item)) {
      notification.warning({
        message: "Không thể chọn sản phẩm hết hàng",
        description: "Vui lòng xóa sản phẩm hết hàng khỏi giỏ hàng",
        placement: "topRight",
      });
      return;
    }

    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Handle select all items (chỉ chọn sản phẩm còn hàng)
  const handleSelectAll = (checked) => {
    if (checked) {
      const availableItems = cart.items.filter(item => !isOutOfStock(item));
      setSelectedItems(new Set(availableItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  // Get selected items total (chỉ tính sản phẩm còn hàng)
  const getSelectedItemsTotal = () => {
    return cart.items
      .filter(item => selectedItems.has(item.id) && !isOutOfStock(item))
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

  // Handle remove all out-of-stock items
  const handleRemoveOutOfStockItems = () => {
    const outOfStockItems = cart.items.filter(item => isOutOfStock(item));
    
    if (outOfStockItems.length === 0) {
      notification.info({
        message: "Không có sản phẩm hết hàng",
        description: "Tất cả sản phẩm trong giỏ hàng đều có sẵn",
        placement: "topRight",
      });
      return;
    }

    const outOfStockNames = outOfStockItems.map(item => item.name).join(", ");

    setConfirmDialog({
      show: true,
      title: 'Xóa sản phẩm hết hàng',
      message: `Bạn có muốn xóa ${outOfStockItems.length} sản phẩm hết hàng khỏi giỏ hàng không?\n\nSản phẩm: ${outOfStockNames}\n\nBạn có thể giữ lại để đợi restock nếu muốn.`,
      onConfirm: () => {
        setLoading(true);
        setTimeout(() => {
          outOfStockItems.forEach(item => {
            removeFromCart(item.id);
          });
          setLoading(false);
          notification.success({
            message: "Đã xóa sản phẩm hết hàng",
            description: `Đã xóa ${outOfStockItems.length} sản phẩm hết hàng khỏi giỏ hàng`,
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
    
    // Tìm sản phẩm trong cart để kiểm tra stock
    const cartItem = cart.items.find(item => item.id === productId);
    if (!cartItem) {
      console.log('❌ Product not found in cart:', productId);
      return;
    }
    
    // Kiểm tra số lượng mới có vượt quá stock không
    if (newQuantity > cartItem.stock) {
      console.log('❌ Cannot update quantity more than available stock:', cartItem.name, 'Stock:', cartItem.stock, 'Requested:', newQuantity);
      
      // Chỉ thông báo lỗi, KHÔNG tự động fill về max
      notification.warning({
        message: "Số lượng vượt quá tồn kho",
        description: `Sản phẩm "${cartItem.name}" chỉ còn ${cartItem.stock} trong kho. Vui lòng nhập số lượng nhỏ hơn hoặc bằng ${cartItem.stock}.`,
        placement: "topRight",
        duration: 5
      });
      
      // KHÔNG update quantity, giữ nguyên giá trị ban đầu
      return;
    }
    
    // Nếu hợp lệ thì update
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

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      notification.warning({
        message: 'Giỏ hàng trống',
        description: 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán',
        placement: 'topRight',
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

    const selectedCartItems = cart.items.filter(item => selectedItems.has(item.id));
    
    // Kiểm tra stock cho các sản phẩm được chọn (giống logic UserCart)
    let hasStockIssue = false;
    
    for (const item of selectedCartItems) {
      // Lấy số lượng gốc ban đầu trong cart (trước khi user thay đổi)
      // Số lượng gốc là số lượng khi user bắt đầu thay đổi (được lưu trong originalQuantities)
      const originalQuantity = originalQuantities[item.id] || item.quantity;
      
      // Kiểm tra xem số lượng hiện tại có vượt quá stock không
      if (item.quantity > item.stock) {
        hasStockIssue = true;
        
        // Thông báo lỗi giống UserCart
        showWarningToast(`Sản phẩm "${item.name}" chỉ còn ${item.stock} trong kho.`);
        
        // Back về số lượng gốc ban đầu trong cart
        updateQuantity(item.id, originalQuantity);
        
        break; // Chỉ xử lý sản phẩm đầu tiên có vấn đề
      }
    }
    
    if (hasStockIssue) {
      return; // Không tiếp tục thanh toán
    }

    // Nếu tất cả đều hợp lệ, tiến hành thanh toán
    console.log('✅ All items have sufficient stock, proceeding to checkout');
    
    notification.success({
      message: "Kiểm tra tồn kho thành công",
      description: `Tất cả sản phẩm đều có đủ hàng. Tiến hành thanh toán ${selectedItems.size} sản phẩm.`,
      placement: "topRight",
    });
    
    // Lấy lại danh sách sản phẩm sau khi đã điều chỉnh stock
    const finalSelectedItems = cart.items.filter(item => selectedItems.has(item.id));
    
    // Chuyển đến trang checkout
    navigate("/checkout-guest", { 
      state: { 
        products: finalSelectedItems,
        fromCart: true 
      } 
    });
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

  // Tính toán số lượng sản phẩm còn hàng và hết hàng
  const availableItems = cart.items.filter(item => !isOutOfStock(item));
  const outOfStockItems = cart.items.filter(item => isOutOfStock(item));
  
  const allSelected = availableItems.length > 0 && selectedItems.size === availableItems.length;
  const someSelected = selectedItems.size > 0 && selectedItems.size < availableItems.length;

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Giỏ hàng ({getCartCount()} sản phẩm)</h1>
        {syncing && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#e6f7ff',
            border: '1px solid #91d5ff',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Spin size="small" />
            <span style={{ color: '#1890ff', fontWeight: '500' }}>
              Đang kiểm tra tồn kho...
            </span>
          </div>
        )}
        <div className="cart-header-actions">
          <Button 
            type="text" 
            icon={<ExclamationCircleOutlined />}
            onClick={async () => {
              setSyncing(true);
              await syncStock();
              setSyncing(false);
              notification.success({
                message: "Đã cập nhật thông tin tồn kho",
                placement: "topRight",
              });
            }}
            loading={syncing}
          >
            Kiểm tra tồn kho
          </Button>
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
          {outOfStockItems.length > 0 && (
            <Button 
              type="text" 
              danger 
              icon={<ExclamationCircleOutlined />}
              onClick={handleRemoveOutOfStockItems}
              style={{ color: '#ff4d4f' }}
            >
              Xóa sản phẩm hết hàng ({outOfStockItems.length})
            </Button>
          )}
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
                Đã chọn {selectedItems.size}/{availableItems.length} sản phẩm
              </span>
            )}
          </div>

          <Spin spinning={loading || syncing}>
            {cart.items.map((item) => {
              const outOfStock = isOutOfStock(item);
              return (
                <div 
                  key={item.id} 
                  className={`cart-item ${selectedItems.has(item.id) ? 'selected' : ''} ${outOfStock ? 'out-of-stock' : ''}`}
                  style={{
                    opacity: outOfStock ? 0.7 : 1,
                    position: 'relative'
                  }}
                >
                  {outOfStock && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      zIndex: 1
                    }}>
                      <Tag color="red" icon={<ExclamationCircleOutlined />}>
                        Hết hàng
                      </Tag>
                    </div>
                  )}
                  
                  <div className="item-checkbox">
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                      disabled={outOfStock}
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
                      style={{ 
                        cursor: 'pointer',
                        filter: outOfStock ? 'grayscale(50%)' : 'none'
                      }}
                      onClick={() => navigate(`/products/${item.id}`)}
                    />
                  </div>
                
                  <div className="item-info">
                    <h3 
                      className="item-name"
                      style={{ 
                        cursor: 'pointer',
                        color: outOfStock ? '#999' : 'inherit'
                      }}
                      onClick={() => navigate(`/products/${item.id}`)}
                    >
                      {item.name}
                      {Number(item.discount) > 0 && !outOfStock && (
                        <span style={{
                          marginLeft: 8,
                          background: '#ff4d4f',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 'bold',
                          fontSize: 12,
                          marginTop: -2,
                          display: 'inline-block'
                        }}>
                          -{item.discount}%
                        </span>
                      )}
                    </h3>
                    <div className="item-price">
                      {Number(item.discount) > 0 && !outOfStock ? (
                        <>
                          <span className="original-price">{formatPrice(item.price)}</span>
                          <span className="discounted-price">
                            {calculateDiscountPrice(item.price, item.discount)}
                          </span>
                        </>
                      ) : (
                        <span className="current-price" style={{ color: outOfStock ? '#999' : 'inherit' }}>
                          {formatPrice(item.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="item-quantity">
                    <span className="quantity-label">Số lượng:</span>
                    <InputNumber
                      min={1}
                      value={item.quantity}
                      step={1}
                      precision={0}
                      stringMode={false}
                      disabled={outOfStock}
                      onChange={(value) => {
                        if (outOfStock) return;
                        
                        // Chỉ xử lý khi value là số hợp lệ và >= 1
                        if (value && typeof value === 'number' && value >= 1) {
                          // Cho phép nhập số lượng bất kỳ, không giới hạn max
                          handleQuantityChange(item.id, value);
                        } else if (value === 0) {
                          setConfirmDialog({
                            show: true,
                            title: 'Xác nhận xóa sản phẩm',
                            message: `Bạn có muốn xóa sản phẩm "${item.name}" khỏi giỏ hàng không?`,
                            onConfirm: () => {
                              removeFromCart(item.id);
                              // Remove from selected items if it was selected
                              const newSelected = new Set(selectedItems);
                              newSelected.delete(item.id);
                              setSelectedItems(newSelected);
                              
                              notification.success({
                                message: 'Đã xóa sản phẩm',
                                description: `Đã xóa ${item.name} khỏi giỏ hàng`,
                                placement: 'topRight',
                              });
                              setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
                            }
                          });
                          // Reset quantity back to 1 if user cancels
                          setTimeout(() => {
                            if (confirmDialog.show) {
                              updateQuantity(item.id, 1);
                            }
                          }, 100);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (outOfStock) {
                          e.preventDefault();
                          return;
                        }
                        // Chỉ cho phép nhập số từ 0-9
                        const charCode = e.which ? e.which : e.keyCode;
                        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                          e.preventDefault();
                        }
                      }}
                      onFocus={() => handleQuantityFocus(item.id, item.quantity)}
                    />
                  </div>

                  <div className="item-total">
                    <span className="total-label">Tổng:</span>
                    <span className="total-price" style={{ color: outOfStock ? '#999' : 'inherit' }}>
                      {Number(item.discount) > 0 && !outOfStock
                        ? calculateDiscountPrice(item.price * item.quantity, item.discount)
                        : formatPrice(item.price * item.quantity)
                      }
                    </span>
                  </div>

                  <div className="item-actions">
                    <Tooltip title={outOfStock ? "Xóa sản phẩm hết hàng" : "Xóa sản phẩm"}>
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
              );
            })}
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

      {/* Custom Warning Toast */}
      {warningToast.show && (
        <CustomWarningToast
          show={warningToast.show}
          message={warningToast.message}
          onClose={hideWarningToast}
        />
      )}
    </div>
  );
};

export default Cart; 