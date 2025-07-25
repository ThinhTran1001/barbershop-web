import React, { useEffect, useState } from "react";
import { getProducts } from "../../services/api";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { Carousel, Button, Card, Row, Col } from "antd";
import "antd/dist/reset.css";
dayjs.extend(duration);

const imageMap = {
  // Nếu có dùng local image map thì copy từ productlistd.jsx
};

export default function HotDeals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const ITEMS_PER_PAGE = 4;

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
    if (imagePath && imagePath.startsWith("/assets")) return imagePath.substring(1);
    return imagePath;
  };

  const hotDeals = products.filter(
    (p) => Number(p.discount) > 0 && p.discountEndDate && dayjs(p.discountEndDate).isAfter(dayjs())
  );
  // Lấy danh sách các ngày có sản phẩm ưu đãi (không trùng lặp, đã sort tăng dần)
  const uniqueDealDays = Array.from(new Set(hotDeals.map(p => dayjs(p.discountEndDate).format('YYYY-MM-DD'))))
    .map(d => dayjs(d)).sort((a, b) => a.valueOf() - b.valueOf());
  const [selectedDay, setSelectedDay] = useState(uniqueDealDays[0] || dayjs());

  // Tự động chọn ngày đầu tiên khi uniqueDealDays thay đổi
  useEffect(() => {
    if (uniqueDealDays.length > 0) {
      setSelectedDay(uniqueDealDays[0]);
    }
  }, [uniqueDealDays.length]);

  // Lọc hotDeals theo ngày đang chọn
  const filteredDeals = hotDeals.filter(p => dayjs(p.discountEndDate).isSame(selectedDay, 'day'));
  const totalPages = Math.ceil(filteredDeals.length / ITEMS_PER_PAGE);
  const slides = Array.from({ length: totalPages }, (_, i) => filteredDeals.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE));

  // Countdown cập nhật từng giây
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Countdown tổng cho khu vực hot deals, lấy theo ngày đang chọn
  const renderMainCountdown = () => {
    // Lấy các deal của ngày đang chọn
    const dealsOfDay = hotDeals.filter(p => dayjs(p.discountEndDate).isSame(selectedDay, 'day'));
    if (dealsOfDay.length === 0) return null;
    // Lấy discountEndDate gần nhất trong ngày đang chọn
    const nextEnd = dealsOfDay.reduce((min, p) => {
      if (!min) return p.discountEndDate;
      return dayjs(p.discountEndDate).isBefore(dayjs(min)) ? p.discountEndDate : min;
    }, null);
    const diff = dayjs(nextEnd).diff(dayjs(now));
    if (diff <= 0) return "Đã hết ưu đãi";
    const d = dayjs.duration(diff);
    const days = d.days().toString().padStart(2, '0');
    const hours = d.hours().toString().padStart(2, '0');
    const minutes = d.minutes().toString().padStart(2, '0');
    const seconds = d.seconds().toString().padStart(2, '0');
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ background: '#fff', color: '#222', fontWeight: 'bold', fontSize: 22, borderRadius: 6, padding: '2px 10px', border: '1px solid #ddd', minWidth: 38, textAlign: 'center', boxShadow: '0 1px 2px #eee' }}>{days}</span>
        <span style={{ fontWeight: 'bold', fontSize: 22, color: '#e74c3c' }}>:</span>
        <span style={{ background: '#fff', color: '#222', fontWeight: 'bold', fontSize: 22, borderRadius: 6, padding: '2px 10px', border: '1px solid #ddd', minWidth: 38, textAlign: 'center', boxShadow: '0 1px 2px #eee' }}>{hours}</span>
        <span style={{ fontWeight: 'bold', fontSize: 22, color: '#e74c3c' }}>:</span>
        <span style={{ background: '#fff', color: '#222', fontWeight: 'bold', fontSize: 22, borderRadius: 6, padding: '2px 10px', border: '1px solid #ddd', minWidth: 38, textAlign: 'center', boxShadow: '0 1px 2px #eee' }}>{minutes}</span>
        <span style={{ fontWeight: 'bold', fontSize: 22, color: '#e74c3c' }}>:</span>
        <span style={{ background: '#fff', color: '#222', fontWeight: 'bold', fontSize: 22, borderRadius: 6, padding: '2px 10px', border: '1px solid #ddd', minWidth: 38, textAlign: 'center', boxShadow: '0 1px 2px #eee' }}>{seconds}</span>
      </div>
    );
  };

  if (loading || error || hotDeals.length === 0) return null;

  return (
    <div style={{ margin: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Hàng ngang: countdown tổng | icon lửa + ƯU ĐÃI HOT (giữa) | chọn ngày (phải) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1200, margin: '0 auto 16px auto', gap: 0 }}>
        {/* Countdown tổng bên trái */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>{renderMainCountdown()}</div>
        {/* Tiêu đề giữa */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <span role="img" aria-label="fire" style={{ fontSize: 32, verticalAlign: 'middle' }}>🔥</span>
          <h2 style={{ color: '#e74c3c', margin: 0, textAlign: 'center', fontSize: 36, fontWeight: 700 }}>ƯU ĐÃI HOT</h2>
        </div>
        {/* Nút ngày bên phải */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {uniqueDealDays.map((d, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDay(d)}
              style={{
                background: d.isSame(selectedDay, 'day') ? '#fff' : '#fff',
                color: d.isSame(selectedDay, 'day') ? '#111' : '#bbb',
                border: d.isSame(selectedDay, 'day') ? '2px solid #111' : '2px solid #fff',
                borderRadius: 8,
                fontWeight: d.isSame(selectedDay, 'day') ? 700 : 400,
                fontSize: 18,
                padding: '4px 18px',
                boxShadow: d.isSame(selectedDay, 'day') ? '0 2px 8px #eee' : 'none',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s',
                opacity: d.isSame(selectedDay, 'day') ? 1 : 0.5,
              }}
            >
              {d.format('DD/MM')}
            </button>
          ))}
        </div>
      </div>
      <div style={{ width: '100%' }}>
        <Carousel autoplay autoplaySpeed={4000} dots={totalPages > 1} arrows={false} pauseOnHover={false} effect="scrollx">
          {slides.map((slide, idx) => (
            <div key={idx}>
              <Row gutter={[24, 24]} justify="center" align="middle" style={{ flexWrap: 'nowrap', display: 'flex' }}>
                {slide.map((product) => (
                  <Col key={product._id} flex="0 0 260px" style={{ display: 'flex', justifyContent: 'center', maxWidth: 260 }}>
                    <Card
                      hoverable
                      style={{ width: 240, border: '2px solid #e74c3c', borderRadius: 8, background: '#fff8f6', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      cover={
                        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                          <img src={getImage(product.image)} alt={product.name} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, margin: '16px auto 8px auto' }} />
                        </div>
                      }
                      bodyStyle={{ padding: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                      {/* Badge discount góc phải trên cùng card */}
                      <div style={{ position: 'absolute', top: 8, right: 8, background: '#ff4d4f', color: '#fff', padding: '2px 8px', borderRadius: 4, fontWeight: 'bold', fontSize: 12, zIndex: 2 }}>
                        -{product.discount}%
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{product.name}</div>
                      <div style={{ color: '#888', textDecoration: 'line-through', fontSize: 13 }}>{product.price.toLocaleString('vi-VN')} VND</div>
                      <div style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>{(product.price * (1 - Number(product.discount) / 100)).toLocaleString('vi-VN')} VND</div>
                      <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'center' }}>
                        <Button type="primary" style={{ background: '#222', borderColor: '#222' }}>Mua hàng</Button>
                        <Button type="default" style={{ background: '#ffe066', borderColor: '#ffe066', color: '#222', fontWeight: 600 }}>Chi tiết</Button>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
} 