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

import {
  getProductById,
  getProducts,
} from "../../services/api";

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
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState(null);

  const getImage = (imagePath) => {
    if (imageMap[imagePath]) return imageMap[imagePath];
    if (imagePath?.startsWith("/assets")) return imagePath.substring(1);
    return imagePath;
  };

  const formatPrice = (price) => {
    const number = parseFloat(price?.toString().replace(/[^\d]/g, ""));
    return number.toLocaleString("vi-VN") + " VND";
  };

  const calculateDiscountPrice = (price, discount) => {
    const number = parseFloat(price?.toString().replace(/[^\d]/g, ""));
    const final = number - (number * discount) / 100;
    return final.toLocaleString("vi-VN") + " VND";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getProductById(id);
        const productData = res.data;
        setProduct(productData);
        setMainImage(productData.image);

        if (productData.relatedProducts?.length > 0) {
          const query = productData.relatedProducts
            .map((id) => `id=${id}`)
            .join("&");
          const relatedRes = await getProducts();
          const filtered = relatedRes.data.filter((p) =>
            productData.relatedProducts.includes(p.id)
          );
          setRelatedProducts(filtered);
        }

        setLoading(false);
      } catch (err) {
        setError("Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.");
        setLoading(false);
        console.error(err);
      }
    };

    window.scrollTo(0, 0);
    fetchData();
  }, [id]);

  const handleQuantityChange = (value) => setQuantity(value);

  const handleAddToCart = () => {
    notification.success({
      message: "Thêm vào giỏ hàng thành công",
      description: `Đã thêm ${quantity} ${product.name} vào giỏ hàng.`,
      icon: <CheckCircleFilled style={{ color: "#52c41a" }} />,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    // navigate("/checkout");
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    notification.info({
      message: isFavorite
        ? "Đã xóa khỏi danh sách yêu thích"
        : "Đã thêm vào danh sách yêu thích",
    });
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

  const discountedPrice = calculateDiscountPrice(
    product.price,
    product.discount
  );

  return (
    <div className="product-detail-container">
      <div className="product-breadcrumb">
        <Breadcrumb>
          <Breadcrumb.Item>
            <span onClick={() => navigate("/")} className="breadcrumb-link">
              Trang chủ
            </span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <span onClick={() => navigate("/products")} className="breadcrumb-link">
              Sản phẩm
            </span>
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
              onError={(e) =>
                (e.target.src =
                  "https://via.placeholder.com/500x500?text=Product+Image")
              }
            />
            {product.discount > 0 && (
              <div className="discount-badge">-{product.discount}%</div>
            )}
          </div>
          <div className="thumbnail-gallery">
            {[product.image, ...(product.additionalImages || [])].map(
              (img, i) => (
                <div
                  key={i}
                  className={`thumbnail-item ${mainImage === img ? "active" : ""}`}
                  onClick={() => setMainImage(img)}
                >
                  <img
                    src={getImage(img)}
                    alt={`thumb-${i}`}
                    onError={(e) =>
                      (e.target.src =
                        "https://via.placeholder.com/100x100?text=Image")
                    }
                  />
                </div>
              )
            )}
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
                <span className="original-price">
                  {formatPrice(product.price)}
                </span>
                <span className="discounted-price">{discountedPrice}</span>
                <span className="save-text">Tiết kiệm: {product.discount}%</span>
              </>
            ) : (
              <span className="current-price">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <div className="product-short-description">
            <p>{product.description}</p>
          </div>

          <div className="product-attributes">
            <div className="attribute-row">
              <span className="attribute-label">Thương hiệu:</span>
              <span className="attribute-value">{product.details?.brand}</span>
            </div>
            {product.details?.volume && (
              <div className="attribute-row">
                <span className="attribute-label">Dung tích:</span>
                <span className="attribute-value">{product.details.volume}</span>
              </div>
            )}
            {product.details?.material && (
              <div className="attribute-row">
                <span className="attribute-label">Chất liệu:</span>
                <span className="attribute-value">
                  {product.details.material}
                </span>
              </div>
            )}
            <div className="attribute-row stock-status">
              <span className="attribute-label">Tình trạng:</span>
              <span
                className={`attribute-value ${
                  product.stock > 0 ? "in-stock" : "out-of-stock"
                }`}
              >
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

              <Button type="text" icon={<ShareAltOutlined />}>
                Chia sẻ
              </Button>
            </div>
          </div>

          <div className="product-benefits">
            <h3>Lợi ích chính:</h3>
            <ul className="benefits-list">
              {product.details?.benefits?.map((b, i) => (
                <li key={i}>
                  <CheckCircleFilled /> {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="product-details-tabs">
        <Tabs defaultActiveKey="1" type="card">
          <TabPane tab="Mô tả chi tiết" key="1">
            <div className="tab-content">
              <p>{product.longDescription}</p>
            </div>
          </TabPane>

          <TabPane tab="Hướng dẫn sử dụng" key="2">
            <div className="tab-content">
              <pre className="usage-instructions">{product.details.usage}</pre>
            </div>
          </TabPane>

          <TabPane tab="Thông số kỹ thuật" key="3">
            <div className="tab-content">
              <table className="specifications-table">
                <tbody>
                  {Object.entries(product.specifications || {}).map(
                    ([key, val]) => (
                      <tr key={key}>
                        <td className="spec-name">{key}</td>
                        <td className="spec-value">{val}</td>
                      </tr>
                    )
                  )}
                  {product.details?.ingredients && (
                    <tr>
                      <td className="spec-name">Thành phần</td>
                      <td className="spec-value">
                        {product.details.ingredients}
                      </td>
                    </tr>
                  )}
                  {product.details?.dimensions && (
                    <tr>
                      <td className="spec-name">Kích thước</td>
                      <td className="spec-value">
                        {product.details.dimensions}
                      </td>
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
                    onError={(e) =>
                      (e.target.src =
                        "https://via.placeholder.com/200x200?text=Product")
                    }
                  />
                  {rel.discount > 0 && (
                    <div className="related-discount-badge">
                      -{rel.discount}%
                    </div>
                  )}
                </div>
                <div className="related-product-info">
                  <h3 className="related-product-name">{rel.name}</h3>
                  <div className="related-product-rating">
                    <Rate
                      disabled
                      allowHalf
                      value={rel.rating}
                      className="small-rating"
                    />
                    <span>({rel.reviews})</span>
                  </div>
                  <div className="related-product-price">
                    {rel.discount > 0 ? (
                      <>
                        <span className="related-original-price">
                          {formatPrice(rel.price)}
                        </span>
                        <span className="related-discounted-price">
                          {calculateDiscountPrice(rel.price, rel.discount)}
                        </span>
                      </>
                    ) : (
                      <span className="related-current-price">
                        {formatPrice(rel.price)}
                      </span>
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
