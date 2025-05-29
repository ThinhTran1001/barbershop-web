/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb } from "antd";
import "../../css/landing/products.css";

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

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        setProducts(response.data);
        setLoading(false);
      } catch (error) {
        setError("Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getImage = (imagePath) => {
    if (imageMap[imagePath]) return imageMap[imagePath];
    if (imagePath?.startsWith("/assets")) return imagePath.substring(1);
    return imagePath;
  };

  const goToProductDetail = (productId) => {
    navigate(`/products/${productId}`);
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const renderPagination = () => (
    <div className="product-pagination">
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index}
          className={`product-page-btn ${currentPage === index + 1 ? "active-page" : ""}`}
          onClick={() => setCurrentPage(index + 1)}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <section className="shop-section">
        <div className="shop-container">
          <div className="shop-header">
            <h2 className="shop-title">TẤT CẢ SẢN PHẨM</h2>
            <div className="shop-divider"></div>
          </div>
          <div className="loading">Đang tải dữ liệu...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="shop-section">
        <div className="shop-container">
          <div className="shop-header">
            <h2 className="shop-title">TẤT CẢ SẢN PHẨM</h2>
            <div className="shop-divider"></div>
          </div>
          <div className="error">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="shop-section">
      <div className="shop-container">
        {/* Breadcrumb */}
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item onClick={() => navigate("/")} className="breadcrumb-link" style={{ cursor: "pointer" }}>
            Trang chủ
          </Breadcrumb.Item>
          <Breadcrumb.Item>Sản phẩm</Breadcrumb.Item>
        </Breadcrumb>

        {/* Header */}
        <div className="shop-header">
          <h2 className="shop-title">TẤT CẢ SẢN PHẨM</h2>
          <div className="shop-divider"></div>
        </div>

        {/* Product grid */}
        <div className="shop-grid-full">
          {currentProducts.map((product) => (
            <div key={product._id} className="shop-item">
              <div className="item-image-wrapper">
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
                <p className="item-price">
                  {product.price.toLocaleString("vi-VN")} VND
                </p>
                <div className="item-buttons">
                  <button className="purchase-button">Mua hàng</button>
                  <button className="detail-button" onClick={() => goToProductDetail(product._id)}>
                    Chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        
        {totalPages > 1 && renderPagination()}
      </div>
    </section>
  );
}
