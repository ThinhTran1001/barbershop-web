import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./ProductDetail.css";
import {
  Rate,
  Tabs,
  InputNumber,
  Button,
  Breadcrumb,
  Skeleton,
  notification,
  Avatar,
  Typography,
  Modal,
} from "antd";
import {
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import dayjs from 'dayjs';

import "../../css/product/productdetail.css";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useUserCart } from "../../context/UserCartContext";
import { getFeedbacksByProduct } from "../../services/api";
import ToastService from "../../services/toastService";

import product1 from "../../assets/images/product1.jpg";
import product2 from "../../assets/images/product2.jpg";
import product3 from "../../assets/images/product3.jpg";
import product4 from "../../assets/images/product4.jpg";

const imageMap = {
  "/assets/images/product1.jpg": product1,
  "/assets/images/product2.jpg": product2,
  "/assets/images/product3.jpg": product3,
  "/assets/images/product4.jpg": product4,
};

const { TabPane } = Tabs;
const { Text, Title } = Typography;

// Custom Bootstrap Toast Component
const CustomToast = ({ show, message, onClose }) => {
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
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div style={{ marginBottom: '15px' }}>
          <div 
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#28a745',
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
              <polyline points="20,6 9,17 4,12"></polyline>
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
          {message}
        </h4>
      </div>
    </div>
  );
};

// Custom Warning Toast Component for limit reached
const CustomWarningToast = ({ show, message, onClose }) => {
  console.log('🎭 CustomWarningToast render - show:', show, 'message:', message);
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
          maxWidth: '400px',
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
              backgroundColor: '#faad14',
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
          {message}
        </h4>
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addToCart: addToGuestCart, cart: guestCart } = useCart();
  const { addToCart: addToUserCart, cart: userCart } = useUserCart();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Custom toast state
  const [customToast, setCustomToast] = useState({
    show: false,
    message: ''
  });

  // Custom warning toast state
  const [warningToast, setWarningToast] = useState({
    show: false,
    message: ''
  });

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const showToast = (variant, message) => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  // Show custom toast
  const showCustomToast = (message) => {
    setCustomToast({
      show: true,
      message
    });
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      hideCustomToast();
    }, 3000);
  };

  // Hide custom toast
  const hideCustomToast = () => {
    setCustomToast(prev => ({ ...prev, show: false }));
  };

  // Show custom warning toast
  const showWarningToast = (message) => {
    console.log('🚨 Showing warning toast with message:', message);
    console.log('🚨 Warning toast state before:', warningToast);
    setWarningToast({
      show: true,
      message
    });
    console.log('🚨 Warning toast state after setState');
    
    // Auto hide after 2 seconds
    setTimeout(() => {
      console.log('🚨 Auto hiding warning toast');
      hideWarningToast();
    }, 1500);
  };

  // Hide custom warning toast
  const hideWarningToast = () => {
    setWarningToast(prev => ({ ...prev, show: false }));
  };

  const addToCart = async (product, quantity) => {
    try {
      console.log('=== ADD TO CART WRAPPER DEBUG ===');
      console.log('User logged in:', !!user);
      console.log('Product:', product.name);
      console.log('Quantity to add:', quantity);
      console.log('Product stock:', product.stock);
      
      // Kiểm tra sản phẩm có hết hàng không
      if (product.stock === 0) {
        console.log('❌ Product is out of stock, cannot add to cart');
        showWarningToast("Sản phẩm đã hết hàng");
        return false;
      }
      
      if (user) {
        const result = await addToUserCart(product, quantity);
        console.log('UserCart result:', result);
        return result;
      } else {
        const result = addToGuestCart(product, quantity);
        console.log('GuestCart result:', result);
        return result;
      }
    } catch (err) {
      console.error('Error in addToCart wrapper:', err);
      return false;
    }
  };

  // Kiểm tra số lượng sản phẩm đã có trong giỏ hàng
  const getCurrentCartQuantity = () => {
    if (!product?.id) return 0;
    
    try {
      let totalQuantity = 0;
      
      if (user) {
        // Sử dụng cart state từ UserCartContext cho user đã đăng nhập
        const userItem = userCart?.items?.find(item => item.productId === product.id || item.id === product.id);
        totalQuantity = userItem ? parseInt(userItem.quantity) : 0;
      } else {
        // Sử dụng cart state từ CartContext cho guest user
        const guestItem = guestCart?.items?.find(item => item.id === product.id);
        totalQuantity = guestItem ? parseInt(guestItem.quantity) : 0;
      }
      
      console.log('=== CART QUANTITY DEBUG ===');
      console.log('Product ID:', product.id);
      console.log('Current cart quantity:', totalQuantity);
      console.log('User logged in:', !!user);
      
      return totalQuantity;
    } catch (error) {
      console.error('Error getting cart quantity:', error);
      return 0;
    }
  };

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/products/${id}`);
        if (!res.ok) throw new Error("Lỗi khi tải sản phẩm");
        const data = await res.json();
        const productData = data.data || data;
        setProduct(productData);
        setMainImage(productData.image);

        // Fetch brand
        if (productData.details?.brandId) {
          const brandRes = await fetch(`http://localhost:3000/api/brands/${productData.details.brandId}`);
          if (brandRes.ok) {
            const brandData = await brandRes.json();
            setBrandName(brandData.name || "");
          }
        }

        // Fetch reviews
        const reviewRes = await getFeedbacksByProduct(id);
        const extracted = reviewRes?.data?.data || reviewRes?.data || [];
        console.log("Extracted reviews from API:", extracted);

        if (Array.isArray(extracted)) {
          setReviews(extracted);
        } else {
          setReviews([]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Không thể tải dữ liệu sản phẩm hoặc đánh giá. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    window.scrollTo(0, 0);
    fetchProductAndReviews();
  }, [id]);





  const getImage = (path) => {
    if (imageMap[path]) return imageMap[path];
    if (path?.startsWith("/assets")) return path.substring(1);
    return path; // Return external URL as is if not in imageMap
  };

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

  const handleAddToCart = async () => {
    if (product) {
      // Kiểm tra sản phẩm có hết hàng không
      if (product.stock === 0) {
        showWarningToast("Sản phẩm đã hết hàng");
        return;
      }
      
      // Kiểm tra quantity hợp lệ
      if (!quantity || quantity < 1 || isNaN(quantity) || 
          (typeof quantity === 'string' && quantity.trim() === '')) {
        console.log('❌ Invalid quantity:', quantity);
        showWarningToast("Vui lòng nhập số lượng từ 1 trở lên.");
        return;
      }
      
      // Lấy số lượng hiện tại trong giỏ hàng
      const currentCartQuantity = getCurrentCartQuantity();
      console.log('=== ADD TO CART DEBUG ===');
      console.log('Product ID:', product.id);
      console.log('Product Stock:', product.stock);
      console.log('Current Cart Quantity:', currentCartQuantity);
      console.log('Quantity to add:', quantity);
      console.log('User logged in:', !!user);
      
      // Tính tổng số lượng user muốn có (trong giỏ hàng + muốn thêm)
      const totalRequestedQuantity = currentCartQuantity + quantity;
      console.log('🔍 Total requested quantity:', totalRequestedQuantity);
      console.log('🔍 Product stock:', product.stock);
      
      // Kiểm tra xem tổng số lượng có vượt quá stock không
      if (totalRequestedQuantity > product.stock) {
        console.log('❌ Total requested quantity exceeds stock');
        console.log('❌ Showing "Số lượng sản phẩm không đủ" message');
        showWarningToast("Số lượng sản phẩm không đủ");
        return;
      }
      
      console.log('=== CALLING ADD TO CART ===');
      const success = await addToCart(product, quantity);
      console.log('=== ADD TO CART RESULT ===');
      console.log('Success:', success);
      
      if (success) {
        console.log('✅ Showing custom success toast');
        showCustomToast("Sản phẩm đã được thêm vào giỏ hàng");
      } else {
        console.log('❌ Showing error toast');
        showWarningToast("Thêm vào giỏ hàng thất bại. Vui lòng thử lại hoặc kiểm tra đăng nhập.");
      }
    }
  };

  const handleBuyNow = async () => {
    // Kiểm tra sản phẩm có hết hàng không
    if (product.stock === 0) {
      showWarningToast("Sản phẩm đã hết hàng");
      return;
    }
    
    // Kiểm tra quantity hợp lệ
    if (!quantity || quantity < 1 || isNaN(quantity) || 
        (typeof quantity === 'string' && quantity.trim() === '')) {
      console.log('❌ Invalid quantity in buy now:', quantity);
      showWarningToast("Vui lòng nhập số lượng từ 1 trở lên.");
      return;
    }
    
    // Lấy số lượng hiện tại trong giỏ hàng
    const currentCartQuantity = getCurrentCartQuantity();
    console.log('=== BUY NOW DEBUG ===');
    console.log('Product ID:', product.id);
    console.log('Product Stock:', product.stock);
    console.log('Current Cart Quantity:', currentCartQuantity);
    console.log('Quantity to add:', quantity);
    console.log('User logged in:', !!user);
    
    // Tính tổng số lượng user muốn có (trong giỏ hàng + muốn thêm)
    const totalRequestedQuantity = currentCartQuantity + quantity;
    console.log('🔍 Total requested quantity:', totalRequestedQuantity);
    console.log('🔍 Product stock:', product.stock);
    
    // Kiểm tra xem tổng số lượng có vượt quá stock không
    if (totalRequestedQuantity > product.stock) {
      console.log('❌ Total requested quantity exceeds stock');
      console.log('❌ Showing "Số lượng sản phẩm không đủ" message');
      showWarningToast("Số lượng sản phẩm không đủ");
      return;
    }
    
    const success = await addToCart(product, quantity);
    if (success) {
      showCustomToast("Sản phẩm đã được thêm vào giỏ hàng");

      // Delay navigation to allow user to see the toast
      setTimeout(() => {
        navigate(user ? "/cart" : "/cart-guest");
      }, 1000);
    } else {
      showWarningToast("Mua ngay thất bại. Vui lòng thử lại hoặc kiểm tra đăng nhập.");
    }
  };

  const toggleFavorite = () => {
    setIsFavorite((prev) => !prev);
    showCustomToast(isFavorite ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích");
  };

  const showImagePreview = (image) => {
    setPreviewImage(image);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setPreviewImage("");
  };

  // Debug log for warning toast state
  console.log('🔍 Current warningToast state:', warningToast);

  if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;

  if (error || !product) {
    return (
      <div className="error-container">
        <h2>Oops! Có lỗi xảy ra</h2>
        <p>{error || "Không tìm thấy sản phẩm"}</p>
        <Button type="primary" onClick={() => navigate("/")}>
          Quay lại trang chính
        </Button>
      </div>
    );
  }

  const discountedPrice = calculateDiscountPrice(product.price, product.discount);

  return (
    <div className="product-detail-container">
      <div className="product-breadcrumb">
        <Breadcrumb>
          <Breadcrumb.Item>
            <span className="breadcrumb-link" onClick={() => navigate("/")}>Trang chủ</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <span className="breadcrumb-link" onClick={() => navigate("/products")}>Sản phẩm</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{product.name}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <div className="product-main">
        <div className="product-gallery">
          <div className="main-image-container">
            <img
              src={getImage(mainImage)}
              alt={product.name}
              className="main-product-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "";
              }}
            />
            {product.discount > 0 && <div className="discount-badge">-{product.discount}%</div>}
          </div>

          <div className="thumbnail-gallery">
            {[product.image, ...(product.additionalImages || [])].map((img, idx) => (
              <div
                key={idx}
                className={`thumbnail-item ${mainImage === img ? "active" : ""}`}
                onClick={() => setMainImage(img)}
              >
                <img src={getImage(img)} alt={`thumb-${idx}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>

          <div className="product-rating-container">
            <Rate disabled allowHalf value={product.rating} />
            <span className="rating-text">{product.rating}/5</span>
            <span className="reviews-count">({product.reviews} đánh giá)</span>
          </div>

          <div className="product-price-container">
            {product.discount > 0 ? (
              <>
                <span className="original-price">{formatPrice(product.price)}</span>
                <span className="discounted-price">{discountedPrice}</span>
                <span className="save-text">Tiết kiệm {product.discount}%</span>
              </>
            ) : (
              <span className="current-price">{formatPrice(product.price)}</span>
            )}
          </div>

          <p className="product-short-description">{product.description}</p>

          <div className="product-attributes">
            <div className="attribute-row">
              <span className="attribute-label">Thương hiệu:</span>
              <span className="attribute-value">{brandName || product.details?.brandId}</span>
            </div>
            {product.details?.volume && (
              <div className="attribute-row">
                <span className="attribute-label">Dung tích:</span>
                <span className="attribute-value">{product.details.volume}</span>
              </div>
            )}
            {product.details?.ingredients && (
              <div className="attribute-row">
                <span className="attribute-label">Thành phần:</span>
                <span className="attribute-value">{product.details.ingredients}</span>
              </div>
            )}
            <div className="attribute-row stock-status">
              <span className="attribute-label">Tình trạng:</span>
              <span className={`attribute-value ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>
                {product.stock > 0 ? `Còn hàng (${product.stock})` : "Hết hàng"}
              </span>
            </div>
          </div>

          <div className="product-actions">
            <div className="quantity-selector">
              <span className="quantity-label">Số lượng:</span>
              <InputNumber
                min={1}
                value={quantity}
                disabled={product.stock === 0}
                onChange={(val) => {
                  // Cho phép user nhập số lượng bất kỳ, không giới hạn max
                  if (val && typeof val === 'number' && val >= 1) {
                    setQuantity(val);
                  } else {
                    // Nếu giá trị không hợp lệ, reset về 1
                    setQuantity(1);
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
              {getCurrentCartQuantity() > 0 && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Đã có {getCurrentCartQuantity()} sản phẩm trong giỏ hàng
                </div>
              )}
            </div>

            <div className="action-buttons">
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                className="add-cart-btn"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                Thêm vào giỏ hàng
              </Button>
              <Button
                type="default"
                className="buy-now-btn"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Hết hàng' : 'Mua ngay'}
              </Button>
            </div>

                         <div className="secondary-actions">
               <Button
                 type="text"
                 icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
                 className={`favorite ${isFavorite ? "active" : ""}`}
                 onClick={toggleFavorite}
               >
                 Yêu thích
               </Button>
               <Button type="text" icon={<ShareAltOutlined />}>
                 Chia sẻ
               </Button>
             </div>
          </div>

          {product.details?.benefits?.length > 0 && (
            <div className="product-benefits">
              <h3>Lợi ích chính:</h3>
              <ul className="benefits-list">
                {product.details.benefits.map((b, i) => (
                  <li key={i}>
                    <CheckCircleFilled /> {b.replace(/"/g, "")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="product-details-tabs">
        <Tabs defaultActiveKey="1" type="card">
          <TabPane tab="Đánh giá sản phẩm" key="1">
            <div className="tab-content">
              <Title level={3} className="review-title">Đánh giá sản phẩm</Title>
              {reviews.length > 0 ? (
                <div className="review-list">
                  {reviews.map((review, idx) => (
                    <div key={idx} className="review-card">
                      <div className="review-header">
                        <Avatar
                          size={48}
                          src={review.userId?.avatar || undefined}
                          className="review-avatar"
                        >
                          {review.userId?.name?.charAt(0) || "K"}
                        </Avatar>
                        <div className="review-details">
                          <Text strong className="review-author">{review.userId?.name || "Khách hàng ẩn danh"}</Text>
                          <div className="review-rating-row">
                            <div className="review-rating">
                              <Rate disabled allowHalf value={review.rating || 0} />
                              {/* <span className="review-rating-text">{review.rating || 0}/5</span> */}
                            </div>
                            <Text className="review-date">
                              {dayjs(review.createdAt).format('DD MMMM YYYY, HH:mm')}
                            </Text>
                          </div>
                        </div>
                      </div>
                      <div className="review-comment-container">
                        <Text className="review-comment">{review.comment || "Không có bình luận"}</Text>
                      </div>
                      {review.images && review.images.length > 0 && (
                        <div className="review-images-container">
                          {review.images.map((img, imgIdx) => (
                            <img
                              key={imgIdx}
                              src={getImage(img)}
                              alt={`review-image-${imgIdx}`}
                              className="review-image"
                              onClick={() => showImagePreview(getImage(img))}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "";
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Text className="no-reviews">Chưa có đánh giá nào cho sản phẩm này.</Text>
              )}
            </div>
          </TabPane>
          <TabPane tab="Mô tả chi tiết" key="4">
            <div className="tab-content">
              <h3>Thông tin sản phẩm</h3>
              <p>{product.description}</p>
            </div>
          </TabPane>
          <TabPane tab="Hướng dẫn sử dụng" key="2">
            <div className="tab-content">
              <h3>Cách sử dụng</h3>
              <pre className="usage-instructions">{product.details?.usage}</pre>
            </div>
          </TabPane>
          <TabPane tab="Thông số kỹ thuật" key="3">
            <div className="tab-content">
              <h3>Thông số sản phẩm</h3>
              <table className="specifications-table">
                <tbody>
                  <tr>
                    <td className="spec-name">Thương hiệu</td>
                    <td className="spec-value">{brandName || product.details?.brandId}</td>
                  </tr>
                  {product.details?.volume && (
                    <tr>
                      <td className="spec-name">Dung tích</td>
                      <td className="spec-value">{product.details.volume}</td>
                    </tr>
                  )}
                  {product.details?.ingredients && (
                    <tr>
                      <td className="spec-name">Thành phần</td>
                      <td className="spec-value">{product.details.ingredients}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabPane>
          
        </Tabs>
      </div>

      <Modal
        visible={isModalVisible}
        footer={null}
        onCancel={handleModalClose}
        className="image-preview-modal"
      >
        <img src={previewImage} alt="Preview" className="preview-image" />
      </Modal>

      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h2 className="section-title">Sản phẩm liên quan</h2>
          <div className="related-products-grid">
            {relatedProducts.map((rel) => (
              <div
                key={rel.id}
                className="related-product-card"
                onClick={() => navigate(`/products/${rel.id}`)}
              >
                <div className="related-product-image">
                  <img
                    src={getImage(rel.image)}
                    alt={rel.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "";
                    }}
                  />
                  {rel.discount > 0 && (
                    <div className="related-discount-badge">-{rel.discount}%</div>
                  )}
                </div>
                <div className="related-product-info">
                  <h3 className="related-product-name">{rel.name}</h3>
                  <div className="related-product-rating">
                    <Rate disabled allowHalf value={rel.rating} className="small-rating" />
                    <span>({rel.reviews})</span>
                  </div>
                  <div className="related-product-price">
                    {rel.discount > 0 ? (
                      <>
                        <span className="related-original-price">{formatPrice(rel.price)}</span>
                        <span className="related-discounted-price">{calculateDiscountPrice(rel.price, rel.discount)}</span>
                      </>
                    ) : (
                      <span className="related-current-price">{formatPrice(rel.price)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

                           {/* Custom Toast Component */}
        <CustomToast
          show={customToast.show}
          message={customToast.message}
          onClose={hideCustomToast}
        />
        
        {/* Custom Warning Toast Component */}
        <CustomWarningToast
          show={warningToast.show}
          message={warningToast.message}
          onClose={hideWarningToast}
        />
    </div>
  );
};

export default ProductDetail;