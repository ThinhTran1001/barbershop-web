import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Rate,
  Tabs,
  InputNumber,
  Button,
  Breadcrumb,
  Skeleton,
  notification,
} from "antd";
import {
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";

import "../../css/product/productdetail.css";
import { useCart } from "../../context/CartContext";

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
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/products/${id}`);
        if (!res.ok) throw new Error("Lỗi khi tải sản phẩm");
        const data = await res.json();
        
        const productData = data.data || data;
        setProduct(productData);
        setMainImage(productData.image);

        if (productData.relatedProducts?.length) {
          const ids = productData.relatedProducts.map((id) => `id=${id}`).join("&");
          const relRes = await fetch(`http://localhost:9999/products?${ids}`);
          if (relRes.ok) {
            const relData = await relRes.json();
            setRelatedProducts(relData);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    window.scrollTo(0, 0);
    fetchProduct();
  }, [id]);

  const getImage = (path) => {
    if (imageMap[path]) return imageMap[path];
    if (path?.startsWith("/assets")) return path.substring(1);
    return path;
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

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      notification.success({
        message: "Đã thêm vào giỏ hàng",
        description: `Đã thêm ${quantity} x ${product.name}`,
        icon: <CheckCircleFilled style={{ color: "#52c41a" }} />,
        placement: "topRight",
      });
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  const toggleFavorite = () => {
    setIsFavorite((prev) => !prev);
    notification.info({
      message: isFavorite ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích",
      placement: "topRight",
    });
  };

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
              <span className="attribute-value">{product.details?.brandId}</span>
            </div>
            {product.details?.volume && (
              <div className="attribute-row">
                <span className="attribute-label">Dung tích:</span>
                <span className="attribute-value">{product.details.volume}</span>
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
                onChange={(val) => setQuantity(val)}
              />
            </div>

            <div className="action-buttons">
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                className="add-cart-btn"
                onClick={handleAddToCart}
              >
                Thêm vào giỏ hàng
              </Button>
              <Button
                type="default"
                className="buy-now-btn"
                onClick={handleBuyNow}
              >
                Mua ngay
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
                    <CheckCircleFilled /> {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
              <h3>Cách sử dụng</h3>
              <pre className="usage-instructions">{product.howToUse}</pre>
            </div>
          </TabPane>
          <TabPane tab="Thông số kỹ thuật" key="3">
            <div className="tab-content">
              <h3>Thông số sản phẩm</h3>
              <table className="specifications-table">
                <tbody>
                  {product.specifications &&
                    Object.entries(product.specifications).map(([key, val]) => (
                      <tr key={key}>
                        <td className="spec-name">{key}</td>
                        <td className="spec-value">{val}</td>
                      </tr>
                    ))}
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
    </div>
  );
};

export default ProductDetail;
