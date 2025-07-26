/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb, Input, Select } from "antd";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useUserCart } from "../../context/UserCartContext";
import "../../css/landing/products.css";

import product1 from "../../assets/images/product1.jpg";
import product2 from "../../assets/images/product2.jpg";
import product3 from "../../assets/images/product3.jpg";
import product4 from "../../assets/images/product4.jpg";
import { getProducts } from "../../services/api";

const { Search } = Input;
const { Option } = Select;

const imageMap = {
  "/assets/images/product1.jpg": product1,
  "/assets/images/product2.jpg": product2,
  "/assets/images/product3.jpg": product3,
  "/assets/images/product4.jpg": product4,
};

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart: addToGuestCart } = useCart();
  const { addToCart: addToUserCart } = useUserCart();
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  
  const addToCart = (product, quantity) => {
    if (user) {
      addToUserCart(product, quantity);
    } else {
      addToGuestCart(product, quantity);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        setProducts(response.data);
        setFilteredProducts(response.data);
        setLoading(false);
    
      } catch (error) {
        setError("Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    fetchProducts();
  
    fetch("http://localhost:3000/api/brands")
      .then(res => res.json())
      .then(data => setBrands(data))
      .catch(() => setBrands([]));
  
    fetch("http://localhost:3000/api/categories")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  const getImage = (imagePath) => {
    if (imageMap[imagePath]) return imageMap[imagePath];
    if (imagePath?.startsWith("/assets")) return imagePath.substring(1);
    return imagePath;
  };

  const handleBuyNow = (product) => {
    addToCart(product, 1);
navigate(user ? "/cart" : "/cart-guest");
  };

  const goToProductDetail = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    applyFilters(value, priceFilter, brandFilter, categoryFilter, stockFilter);
    setCurrentPage(1);
  };

  const handlePriceFilter = (value) => {
    setPriceFilter(value);
    applyFilters(searchTerm, value, brandFilter, categoryFilter, stockFilter);
    setCurrentPage(1);
  };

  const handleBrandFilter = (value) => {
    setBrandFilter(value);
    applyFilters(searchTerm, priceFilter, value, categoryFilter, stockFilter);
    setCurrentPage(1);
  };
  const handleCategoryFilter = (value) => {
    setCategoryFilter(value);
    applyFilters(searchTerm, priceFilter, brandFilter, value, stockFilter);
    setCurrentPage(1);
  };
  const handleStockFilter = (value) => {
    setStockFilter(value);
    applyFilters(searchTerm, priceFilter, brandFilter, categoryFilter, value);
    setCurrentPage(1);
  };

  const applyFilters = (searchValue, priceValue, brandValue = brandFilter, categoryValue = categoryFilter, stockValue = stockFilter) => {
    let filtered = [...products];

    if (searchValue) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    if (priceValue !== "all") {
      filtered = filtered.filter((p) => {
        const price = Number(p.price);
        if (priceValue === "<500") return price < 500000;
        if (priceValue === "500-1000") return price >= 500000 && price <= 1000000;
        if (priceValue === ">1000") return price > 1000000;
        return true;
      });
    }

    if (brandValue !== "all") {
      filtered = filtered.filter((p) => p.details?.brandId === brandValue);
    }
    if (categoryValue !== "all") {
      filtered = filtered.filter((p) => p.categoryId?.includes(categoryValue));
    }
    if (stockValue !== "all") {
      if (stockValue === "in") filtered = filtered.filter((p) => p.stock > 0);
      if (stockValue === "out") filtered = filtered.filter((p) => !p.stock || p.stock <= 0);
    }

    setFilteredProducts(filtered);
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

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

  if (loading || error) {
    return (
      <section className="shop-section">
<div className="shop-container">
          <div className="shop-header">
            <h2 className="shop-title">TẤT CẢ SẢN PHẨM</h2>
            <div className="shop-divider"></div>
          </div>
          {loading && <div className="loading">Đang tải dữ liệu...</div>}
          {error && <div className="error">{error}</div>}
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

        {/* Search and Filter */}
        <div className="d-flex justify-content-between flex-wrap mb-4 gap-2">
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              applyFilters(e.target.value, priceFilter, brandFilter, categoryFilter, stockFilter);
              setCurrentPage(1);
            }}
            allowClear
            style={{ width: 220 }}
          />
          <Select defaultValue="all" style={{ width: 160 }} onChange={handlePriceFilter}>
            <Option value="all">Tất cả mức giá</Option>
            <Option value="<500">Dưới 500.000đ</Option>
            <Option value="500-1000">500.000đ - 1.000.000đ</Option>
            <Option value=">1000">Trên 1.000.000đ</Option>
          </Select>
          <Select defaultValue="all" style={{ width: 160 }} onChange={handleBrandFilter}>
            <Option value="all">Tất cả thương hiệu</Option>
            {brands.map(b => (
              <Option key={b._id} value={b._id}>{b.name}</Option>
            ))}
          </Select>
          <Select defaultValue="all" style={{ width: 160 }} onChange={handleCategoryFilter}>
            <Option value="all">Tất cả danh mục</Option>
            {categories.map(c => (
              <Option key={c._id} value={c._id}>{c.name}</Option>
            ))}
          </Select>
          <Select defaultValue="all" style={{ width: 160 }} onChange={handleStockFilter}>
            <Option value="all">Tất cả tình trạng</Option>
            <Option value="in">Còn hàng</Option>
            <Option value="out">Hết hàng</Option>
          </Select>
        </div>

        {/* Product Grid */}
        <div className="shop-grid-full">
          {currentProducts.map((product) => (
            <div key={product._id} className="shop-item" onClick={() => goToProductDetail(product._id)}>
              <div className="item-image-wrapper" style={{ position: 'relative' }}>
                {product.discount > 0 && (
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
                    e.target.src = "";
                  }}
                />
              </div>
              <div className="item-details">
                <h3 className="item-name">{product.name}</h3>
                <div className="item-price">
                  {product.discount > 0 ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: '#888', marginRight: 8 }}>
                        {product.price.toLocaleString("vi-VN")} VND
                      </span>
                      <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                        {(product.price * (1 - product.discount / 100)).toLocaleString("vi-VN")} VND
                      </span>
                    </>
                  ) : (
                    <span>{product.price.toLocaleString("vi-VN")} VND</span>
                  )}
                </div>
                <div className="item-buttons">
                  <button className="purchase-button" onClick={() => handleBuyNow(product)}>Mua hàng</button>
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
