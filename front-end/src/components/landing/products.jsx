import React from "react";
import "../../css/landing/products.css";
import product1 from "../../assets/images/product1.jpg";
import product2 from "../../assets/images/product2.jpg";
import product3 from "../../assets/images/product3.jpg";
import product4 from "../../assets/images/product4.jpg";

const products = [
  {
    id: 1,
    name: "Kem tạo bọt",
    price: "1.200.000 VND",
    image: product1,
  },
  {
    id: 2,
    name: "Sáp vuốt tóc",
    price: "800.000 VND",
    image: product2,
  },
  {
    id: 3,
    name: "Cọ tạo bọt",
    price: "700.000 VND",
    image: product3,
  },
  {
    id: 4,
    name: "Gel vuốt tóc",
    price: "300.000 VND",
    image: product4,
  },
];

export default function ShopItems() {
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
                <img src={product.image} alt={product.name} className="item-image" />
              </div>
              <div className="item-details">
                <h3 className="item-name">{product.name}</h3>
                <p className="item-price">{product.price}</p>
                <button className="purchase-button">
                  Mua hàng
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}