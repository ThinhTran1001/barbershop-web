import React, { useState, useEffect } from "react";
import "../../css/landing/barber.css";

// Import hình ảnh tĩnh
import barber1 from "../../assets/images/barber1.jpg";
import barber2 from "../../assets/images/barber2.jpg";
import barber3 from "../../assets/images/barber3.jpg";

// Map đường dẫn từ API đến hình ảnh đã import
const imageMap = {
  "/assets/images/barber1.jpg": barber1,
  "/assets/images/barber2.jpg": barber2,
  "/assets/images/barber3.jpg": barber3,
};

export default function Barbers() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/barbers");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setBarbers(data);
        setLoading(false);
      } catch (error) {
        setError("Không thể tải dữ liệu thợ cắt tóc. Vui lòng thử lại sau.");
        setLoading(false);
        console.error("Error fetching barbers:", error);
      }
    };

    fetchBarbers();
  }, []);

  // Hàm xử lý đường dẫn hình ảnh từ API
  const getImage = (imagePath) => {
    // Nếu có trong imageMap, sử dụng hình ảnh đã import
    if (imageMap[imagePath]) {
      return imageMap[imagePath];
    }
    
    // Nếu đường dẫn bắt đầu bằng "/assets", chuyển sang đường dẫn tương đối
    if (imagePath && imagePath.startsWith("/assets")) {
      // Loại bỏ dấu "/" ở đầu để tạo đường dẫn tương đối
      return imagePath.substring(1);
    }
    
    return imagePath;
  };

  if (loading) {
    return (
      <section className="barbers-section">
        <div className="container">
          <div className="barbers-header">
            <h2 className="barbers-title">BARBERS</h2>
            <div className="title-divider"></div>
          </div>
          <div className="loading">Đang tải dữ liệu...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="barbers-section">
        <div className="container">
          <div className="barbers-header">
            <h2 className="barbers-title">BARBERS</h2>
            <div className="title-divider"></div>
          </div>
          <div className="error">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="barbers-section">
      <div className="container">
        <div className="barbers-header">
          <h2 className="barbers-title">BARBERS</h2>
          <div className="title-divider"></div>
        </div>
        
        <div className="barbers-grid">
          {barbers.map((barber) => (
            <div key={barber.id} className="barber-card">
              <div className="barber-image-container">
                <img 
                  src={getImage(barber.image)}
                  alt={barber.name} 
                  className="barber-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/300x400?text=Barber+Image";
                  }}
                />
              </div>
              <h3 className="barber-name">{barber.name}</h3>
              <p className="barber-specialty">{barber.specialty}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}