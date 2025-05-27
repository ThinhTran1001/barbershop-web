import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Rate, Tabs, InputNumber, Button, Breadcrumb, Skeleton, notification } from "antd";
import { ShoppingCartOutlined, HeartOutlined, HeartFilled, ShareAltOutlined, CheckCircleFilled } from "@ant-design/icons";
import "../../css/product/productdetail.css";


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

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
     
        const response = await fetch(`http://localhost:3000/api/products/${id}`);
        console.log(id);
        
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setProduct(data);
        setMainImage(data.image);

       
        if (data.relatedProducts && data.relatedProducts.length > 0) {
          const relatedIds = data.relatedProducts.join("&id=");
          const relatedResponse = await fetch(`http://localhost:9999/products?id=${relatedIds}`);
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            setRelatedProducts(relatedData);
          }
        }

        setLoading(false);
      } catch (error) {
        setError("Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.");
        setLoading(false);
        console.error("Error fetching product:", error);
      }
    };

    window.scrollTo(0, 0);
    fetchProductDetail();
  }, [id]);


  const getImage = (imagePath) => {
    if (imageMap[imagePath]) {
      return imageMap[imagePath];
    }
    
    if (imagePath && imagePath.startsWith("/assets")) {
      return imagePath.substring(1);
    }
    
    return imagePath;
  };

  const handleQuantityChange = (value) => {
    setQuantity(value);
  };

  const handleAddToCart = () => {
    notification.success({
      message: "Thêm vào giỏ hàng thành công",
      description: `Đã thêm ${quantity} ${product.name} vào giỏ hàng.`,
      placement: "topRight",
      icon: <CheckCircleFilled style={{ color: "#52c41a" }} />,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    // Điều hướng đến trang thanh toán
    // navigate("/checkout");
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    notification.info({
      message: isFavorite ? "Đã xóa khỏi danh sách yêu thích" : "Đã thêm vào danh sách yêu thích",
      placement: "topRight",
    });
  };

  const calculateDiscountPrice = (price, discount) => {
    if (!discount) return null;
    
    const priceNumber = parseFloat(price.replace(/[^\d]/g, ""));
    const discountedPrice = priceNumber - (priceNumber * discount / 100);
    
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountedPrice);
  };

  const formatPrice = (price) => {
    return price;
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-container error-container">
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
         <br></br>
         <br></br>
         <br></br>
         <br></br>
         <br></br>
      <div className="product-breadcrumb">
        <Breadcrumb>
          <Breadcrumb.Item>
            <span onClick={() => navigate("/")} className="breadcrumb-link">Trang chủ</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <span onClick={() => navigate("/products")} className="breadcrumb-link">Sản phẩm</span>
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
                e.target.src = "https://via.placeholder.com/500x500?text=Product+Image";
              }}
            />
            {product.discount > 0 && (
              <div className="discount-badge">-{product.discount}%</div>
            )}
          </div>
          
          <div className="thumbnail-gallery">
            <div
              className={`thumbnail-item ${mainImage === product.image ? "active" : ""}`}
              onClick={() => setMainImage(product.image)}
            >
              <img src={getImage(product.image)} alt={product.name} />
            </div>
            
            {product.additionalImages && product.additionalImages.map((image, index) => (
              <div
                key={index}
                className={`thumbnail-item ${mainImage === image ? "active" : ""}`}
                onClick={() => setMainImage(image)}
              >
                <img
                  src={getImage(image)}
                  alt={`${product.name} - View ${index + 1}`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/100x100?text=Image";
                  }}
                />
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
                <span className="save-text">Tiết kiệm: {product.discount}%</span>
              </>
            ) : (
              <span className="current-price">{formatPrice(product.price)}</span>
            )}
          </div>
          
          <div className="product-short-description">
            <p>{product.description}</p>
          </div>
          
          <div className="product-attributes">
            <div className="attribute-row">
              <span className="attribute-label">Thương hiệu:</span>
              <span className="attribute-value">{product.details.brandId}</span>
            </div>
            {product.details.volume && (
              <div className="attribute-row">
                <span className="attribute-label">Dung tích:</span>
                <span className="attribute-value">{product.details.volume}</span>
              </div>
            )}
            {product.details.material && (
              <div className="attribute-row">
                <span className="attribute-label">Chất liệu:</span>
                <span className="attribute-value">{product.details.material}</span>
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
                max={product.stock}
                value={quantity}
                onChange={handleQuantityChange}
                disabled={product.stock <= 0}
              />
            </div>
            
            <div className="action-buttons">
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                size="large"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="add-cart-btn"
              >
                Thêm vào giỏ hàng
              </Button>
              
              <Button
                type="default"
                size="large"
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="buy-now-btn"
              >
                Mua ngay
              </Button>
            </div>
            
            <div className="secondary-actions">
              <Button
                type="text"
                icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
                onClick={toggleFavorite}
                className={isFavorite ? "favorite active" : "favorite"}
              >
                Yêu thích
              </Button>
              
              <Button
                type="text"
                icon={<ShareAltOutlined />}
              >
                Chia sẻ
              </Button>
            </div>
          </div>
          
          <div className="product-benefits">
            <h3>Lợi ích chính:</h3>
            <ul className="benefits-list">
              {product.details.benefits.map((benefit, index) => (
                <li key={index}><CheckCircleFilled /> {benefit}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="product-details-tabs">
        <Tabs defaultActiveKey="1" type="card">
          <TabPane tab="Mô tả chi tiết" key="1">
            <div className="tab-content">
              <h3>Thông tin sản phẩm</h3>
              <p>{product.longDescription}</p>
            </div>
          </TabPane>
          
          <TabPane tab="Hướng dẫn sử dụng" key="2">
            <div className="tab-content">
              <h3>Cách sử dụng sản phẩm</h3>
              <pre className="usage-instructions">{product.howToUse}</pre>
            </div>
          </TabPane>
          
          <TabPane tab="Thông số kỹ thuật" key="3">
            <div className="tab-content">
              <h3>Thông số sản phẩm</h3>
              <table className="specifications-table">
                <tbody>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <tr key={key}>
                      <td className="spec-name">{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                      <td className="spec-value">{value}</td>
                    </tr>
                  ))}
                  {product.details.ingredients && (
                    <tr>
                      <td className="spec-name">Thành phần</td>
                      <td className="spec-value">{product.details.ingredients}</td>
                    </tr>
                  )}
                  {product.details.dimensions && (
                    <tr>
                      <td className="spec-name">Kích thước</td>
                      <td className="spec-value">{product.details.dimensions}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabPane>
        </Tabs>
      </div>

      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h2 className="section-title">Sản phẩm liên quan</h2>
          <div className="related-products-grid">
            {relatedProducts.map(relProduct => (
              <div
                key={relProduct.id}
                className="related-product-card"
                onClick={() => navigate(`/products/${relProduct.id}`)}
              >
                <div className="related-product-image">
                  <img
                    src={getImage(relProduct.image)}
                    alt={relProduct.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/200x200?text=Product";
                    }}
                  />
                  {relProduct.discount > 0 && (
                    <div className="related-discount-badge">-{relProduct.discount}%</div>
                  )}
                </div>
                <div className="related-product-info">
                  <h3 className="related-product-name">{relProduct.name}</h3>
                  <div className="related-product-rating">
                    <Rate disabled allowHalf value={relProduct.rating} className="small-rating" />
                    <span>({relProduct.reviews})</span>
                  </div>
                  <div className="related-product-price">
                    {relProduct.discount > 0 ? (
                      <>
                        <span className="related-original-price">{formatPrice(relProduct.price)}</span>
                        <span className="related-discounted-price">
                          {calculateDiscountPrice(relProduct.price, relProduct.discount)}
                        </span>
                      </>
                    ) : (
                      <span className="related-current-price">{formatPrice(relProduct.price)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;