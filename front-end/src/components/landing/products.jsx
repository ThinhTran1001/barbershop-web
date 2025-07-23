import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/landing/products.css";
import { useAuth } from '../../context/AuthContext';

import product1 from "../../assets/images/product1.jpg";
import product2 from "../../assets/images/product2.jpg";
import product3 from "../../assets/images/product3.jpg";
import product4 from "../../assets/images/product4.jpg";
import { getProducts } from "../../services/api";

const imageMap = {
  "/assets/images/product1.jpg": product1,
  "/assets/images/product2.jpg": product2,
  "/assets/images/product3.jpg": product3,
  "/assets/images/product4.jpg": product4,
};

const ITEMS_PER_PAGE = 4;

export default function ShopItems() {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        const data = response.data;
        setProducts(data);
        setLoading(false);
      } catch (error) {
        setError("Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.");
        setLoading(false);
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  const getImage = (imagePath) => {
    if (imageMap[imagePath]) return imageMap[imagePath];
    if (imagePath && imagePath.startsWith("/assets")) return imagePath.substring(1);
    return imagePath;
  };

  const goToProductDetail = (productId) => {
    navigate(`/products/${productId}`);
  };

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleBuyNow = (product) => {
    if (user) {
      navigate("/checkout", { state: { products: [{ productId: product._id, quantity: 1, product }] } });
    } else {
      navigate("/checkout-guest", { state: { products: [{ productId: product._id, quantity: 1, product }] } });
    }
  };

  return (
    <section className="shop-section">
      <div className="shop-container">
        <div className="shop-header">
          <h2 className="shop-title">SẢN PHẨM CỦA CHÚNG TÔI</h2>
          <div className="shop-divider"></div>
        </div>

        {loading && <div className="loading">Đang tải dữ liệu...</div>}
        {error && <div className="error">{error}</div>}

        {!loading && !error && (
          <>
            <div className="shop-grid-full">
              {paginatedProducts.map((product) => (
                <div key={product.id || product._id} className="shop-item">
                  <div className="item-image-wrapper" style={{ position: 'relative' }}>
                    {Number(product.discount) > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: '#ff4d4f',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 'bold',
                          fontSize: 12,
                          zIndex: 2
                        }}
                      >
                        -{product.discount}%
                      </div>
                    )}
                    <img
                      src={getImage(product.image)}
                      alt={product.name}
                      className="item-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/300x300?text=Product+Image";
                      }}
                    />
                  </div>
                  <div className="item-details">
                    <h3 className="item-name">{product.name}</h3>
                    <div className="item-price">
                      {Number(product.discount) > 0 ? (
                        <>
                          <span style={{ textDecoration: 'line-through', color: '#888', marginRight: 8 }}>
                            {product.price.toLocaleString("vi-VN")} VND
                          </span>
                          <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                            {(product.price * (1 - Number(product.discount) / 100)).toLocaleString("vi-VN")} VND
                          </span>
                        </>
                      ) : (
                        <span>{product.price.toLocaleString("vi-VN")} VND</span>
                      )}
                    </div>
                    <div className="item-buttons">
                      <button 
                        className="purchase-button" 
                        onClick={() => handleBuyNow(product)}
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? "Hết hàng" : "Mua hàng"}
                      </button>
                      <button
                        className="detail-button"
                        onClick={() => goToProductDetail(product._id)}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="product-pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`product-page-btn ${
                      page === currentPage ? "active-page" : ""
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
