import React, { useState, useEffect } from "react";
import { Input, Select, Breadcrumb } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
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
  const { addToCart } = useCart();

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
  }, []);

  const getImage = (imagePath) => {
    if (imageMap[imagePath]) return imageMap[imagePath];
    if (imagePath?.startsWith("/assets")) return imagePath.substring(1);
    return imagePath;
  };

  const handleBuyNow = (product) => {
    addToCart(product, 1);
    if (user) {
      navigate("/checkout", { state: { products: [{ productId: product._id, quantity: 1, product }] } });
    } else {
      navigate("/checkout-guest");
    }
  };

  const goToProductDetail = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    applyFilters(value, priceFilter);
    setCurrentPage(1);
  };

  const handlePriceFilter = (value) => {
    setPriceFilter(value);
    applyFilters(searchTerm, value);
    setCurrentPage(1);
  };

  const applyFilters = (searchValue, priceValue) => {
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
          <Search
            placeholder="Tìm kiếm sản phẩm..."
            onSearch={handleSearch}
            allowClear
            style={{ width: 300 }}
          />
          <Select defaultValue="all" style={{ width: 200 }} onChange={handlePriceFilter}>
            <Option value="all">Tất cả mức giá</Option>
            <Option value="<500">Dưới 500.000đ</Option>
            <Option value="500-1000">500.000đ - 1.000.000đ</Option>
            <Option value=">1000">Trên 1.000.000đ</Option>
          </Select>
        </div>

        {/* Product Grid */}
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
                    e.target.src = "";
                  }}
                />
              </div>
              <div className="item-details">
                <h3 className="item-name">{product.name}</h3>
                <p className="item-price">
                  {product.price.toLocaleString("vi-VN")} VND
                </p>
                <div className="item-buttons">
                  <button 
                    className="purchase-button" 
                    onClick={() => handleBuyNow(product)}
                    disabled={product.stock === 0}
                  >
                    {product.stock === 0 ? "Hết hàng" : "Mua hàng"}
                  </button>
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
