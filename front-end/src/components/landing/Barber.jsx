import React, { useState, useEffect } from "react";
import "../../css/landing/barber.css";
import { getAllUser } from "../../services/api";

// import ảnh tĩnh...
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
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Lấy danh sách barbers (fetch API)
        const barberRes = await fetch("http://localhost:3000/api/barbers");
        if (!barberRes.ok) {
          throw new Error(`Barbers API error: ${barberRes.status}`);
        }
        const barbersData = await barberRes.json();

        // 2. Lấy danh sách users (Axios)
        const userRes = await getAllUser();
        // Axios sẽ throw nếu status != 2xx, và kết quả nằm trong userRes.data
        const usersData = userRes.data;

        // 3. Đẩy vào state
        setBarbers(barbersData);
        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getImage = (path) => {
    if (imageMap[path]) return imageMap[path];
    if (path?.startsWith("/assets")) return path.substring(1);
    return path;
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
          {barbers.map((b) => {
            const avatar = users.find(u => u._id === b.userId._id)?.avatarUrl;
            return (
              <div key={b.id} className="barber-card">
                <div className="barber-image-container">
                  <img
                    src={avatar || getImage(b.image)}
                    alt={b.name}
                    className="barber-image"
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/300x400?text=Barber+Image";
                    }}
                  />
                </div>
                <h3 className="barber-name">{b.userId.name}</h3>
                <p className="barber-specialty">{b.specialties.join(", ")}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
