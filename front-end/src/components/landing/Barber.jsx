import React, { useState, useEffect } from "react";
import "../../css/landing/barber.css";
import { getBarbers } from "../../services/api";

// Import hình ảnh tĩnh
import barber1 from "../../assets/images/barber1.jpg";
import barber2 from "../../assets/images/barber2.jpg";
import barber3 from "../../assets/images/barber3.jpg";

const imageMap = {
  "/assets/images/barber1.jpg": barber1,
  "/assets/images/barber2.jpg": barber2,
  "/assets/images/barber3.jpg": barber3,
};

export default function Barbers() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const barbersPerPage = 3;

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const response = await getBarbers();
        setBarbers(response.data);
        setLoading(false);
      } catch (error) {
        setError("Không thể tải dữ liệu thợ cắt tóc. Vui lòng thử lại sau.");
        setLoading(false);
        console.error("Error fetching barbers:", error);
      }
    };

    fetchBarbers();
  }, []);

  const getImage = (imagePath) => {
    if (imageMap[imagePath]) return imageMap[imagePath];
    if (imagePath?.startsWith("/assets")) return imagePath.substring(1);
    return imagePath;
  };

  const indexOfLastBarber = currentPage * barbersPerPage;
  const indexOfFirstBarber = indexOfLastBarber - barbersPerPage;
  const currentBarbers = barbers.slice(indexOfFirstBarber, indexOfLastBarber);
  const totalPages = Math.ceil(barbers.length / barbersPerPage);

  const renderPagination = () => (
    <div className="pagination">
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index}
          className={`pagination-button ${currentPage === index + 1 ? "active" : ""}`}
          onClick={() => setCurrentPage(index + 1)}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );

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
          {currentBarbers.map((barber) => (
            <div key={barber._id || barber.id} className="barber-card">
              <div className="barber-image-container">
                <img
                  src={getImage(barber.image)}
                  alt={barber.name}
                  className="barber-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/300x400?text=Barber+Image";
                  }}
                />
              </div>
              <h3 className="barber-name">{barber.name}</h3>
              <p className="barber-specialty">{barber.specialty}</p>
            </div>
          ))}
        </div>

        {totalPages>1 && renderPagination()}
      </div>
    </section>
  );
}
