import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import "../../css/landing/products.css";

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

export default function ShopItems() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:9999/products");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
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

    if (imageMap[imagePath]) {
      return imageMap[imagePath];
    }

    if (imagePath && imagePath.startsWith("/assets")) {
   
      return imagePath.substring(1);
    }
    
    return imagePath;
  };


  const goToProductDetail = (productId) => {
    navigate(`/products/${productId}`);
  };

  if (loading) {
    return (
      <section className="shop-section">
        <div className="shop-container">
          <div className="shop-header">
            <h2 className="shop-title">SẢN PHẨM CỦA CHÚNG TÔI</h2>
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
            <h2 className="shop-title">SẢN PHẨM CỦA CHÚNG TÔI</h2>
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
        <div className="shop-header">
          <h2 className="shop-title">SẢN PHẨM CỦA CHÚNG TÔI</h2>
          <div className="shop-divider"></div>
        </div>
        
        <div className="shop-grid-full">
          {products.map((product) => (
            <div key={product.id} className="shop-item">
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
                <p className="item-price">{product.price}</p>
                <div className="item-buttons">
                  <button className="purchase-button">
                    Mua hàng
                  </button>
                  <button 
                    className="detail-button"
                    onClick={() => goToProductDetail(product.id)}
                  >
                    Chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}