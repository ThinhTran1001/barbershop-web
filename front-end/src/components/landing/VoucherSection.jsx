import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const tagStyle = {
  display: 'inline-block',
  background: '#fffde7', // vàng nhạt hơn
  color: '#bfa43a', // vàng dịu hơn
  borderRadius: 8,
  padding: '2px 10px',
  fontSize: 13,
  fontWeight: 600,
  marginRight: 6,
  marginBottom: 2,
  border: '1px solid #ffe066',
};

const VoucherSection = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await axios.get('/api/vouchers/public');
        setVouchers(res.data.data || []);
      } catch (err) {
        setError('Không thể tải danh sách voucher.');
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  // Bỏ auto-scroll, chỉ để kéo ngang thủ công

  if (loading) return <div style={{textAlign:'center', margin:'32px 0'}}>Đang tải ưu đãi...</div>;
  if (error) return <div style={{color:'red', textAlign:'center', margin:'32px 0'}}>{error}</div>;
  if (vouchers.length === 0) return null;

  const v = vouchers[currentIndex];
  const today = new Date();
  const end = new Date(v.endDate);
  today.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 24px 24px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 32, color: '#bfa43a', letterSpacing: 1 }}>
        <span role="img" aria-label="fire">🔥</span> VOUCHERS
      </h2>
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 24,
          overflowX: 'auto',
          paddingBottom: 16,
          marginLeft: 0,
          marginRight: 0,
          width: '100%',
        }}
        className="voucher-marquee-container"
      >
        {vouchers.map((v, idx) => {
          const today = new Date();
          const end = new Date(v.endDate);
          today.setHours(0,0,0,0);
          end.setHours(0,0,0,0);
          const diffTime = end - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return (
            <div
              key={(v._id || v.code) + '-' + idx}
              className="voucher-card"
              style={{
                minWidth: '220px',
                maxWidth: 260,
                margin: '0 8px',
                border: '2px solid #ffe066',
                borderRadius: 18,
                padding: 12,
                background: 'linear-gradient(135deg, #fffde7 60%, #fff 100%)',
                boxShadow: '0 4px 16px #ffe06655',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                transition: 'box-shadow 0.2s, transform 0.2s',
                cursor: 'default',
                height: 200, // cố định chiều cao card
                justifyContent: 'space-between'
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px #ffe06677'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px #ffe06655'}
            >
          {/* Badge sắp hết hạn nổi ra ngoài card */}
          {(diffDays <= 3 && diffDays >= 0) && (
            <div style={{
              position: 'absolute',
              top: -16,
              right: 16,
              background: '#ff9800',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              borderRadius: 12,
              padding: '3px 14px 3px 8px',
              boxShadow: '0 2px 8px #ff980055',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              zIndex: 2,
              transform: 'translateY(-50%)'
            }}
            onClick={e => e.stopPropagation()}>
              <span role="img" aria-label="clock">⏰</span> Sắp hết hạn
            </div>
          )}
          {/* SLOT 1: Tên voucher */}
          <div style={{ minHeight: 2, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#333', marginBottom: 0 }}>
            <span role="img" aria-label="gift"></span>
            <span style={{ marginLeft: 8 }}>{v.code}</span>
          </div>
          {/* SLOT 2: Giảm giá */}
          <div style={{ minHeight: 2, width: '100%', textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#2e7d32', marginBottom: 0 }}>
            Giảm {v.type === 'percent' ? `${v.value}%` : `${v.value.toLocaleString()}đ`}
          </div>
          {/* SLOT 3: Điều kiện đơn tối thiểu */}
          <div style={{ minHeight: 2, width: '100%', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 0 }}>
            <span style={{ ...tagStyle, background: '#fffbe6', color: '#ad6800', border: '1px solid #ffe58f' }}>Đơn tối thiểu {(v.minOrderAmount || 0).toLocaleString()}đ</span>
          </div>
          {/* SLOT 4: Giảm tối đa (nếu có) hoặc dòng trống giữ chỗ */}
          <div style={{ minHeight: 2, width: '100%', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 0 }}>
            {v.type === 'percent' && v.maxDiscountAmount > 0 ? (
              <span style={{ ...tagStyle, background: '#fffbe6', color: '#ad6800', border: '1px solid #ffe58f' }}>Giảm tối đa {v.maxDiscountAmount.toLocaleString()}đ</span>
            ) : (
              <span style={{ visibility: 'hidden' }}>placeholder</span>
            )}
          </div>
          {/* SLOT 5: Hạn sử dụng */}
          <div style={{ minHeight: 2, width: '100%', textAlign: 'center', color: '#d9534f', fontWeight: 600, fontSize: 15, marginBottom: 0 }}>
            {diffDays > 1 && `Còn ${diffDays} ngày`}
            {diffDays === 1 && 'Còn 1 ngày'}
            {diffDays === 0 && 'Hết hạn hôm nay'}
            {diffDays < 0 && 'Đã hết hạn'}
          </div>
          {/* SLOT 6: Số lượt sử dụng còn lại (thay bằng progress bar) */}
          <div style={{ minHeight: 40, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
            {typeof v.usageLimit === 'number' && v.usageLimit > 0 && typeof v.usedCount === 'number' && v.usedCount >= 0 ? (
              <>
                {/* Progress bar */}
                <div style={{
                  width: '90%',
                  height: 12,
                  background: '#f5f5f5',
                  borderRadius: 8,
                  overflow: 'hidden',
                  marginBottom: 4,
                  boxShadow: '0 1px 4px #eee',
                }}>
                  <div style={{
                    width: `${Math.min(100, Math.round((v.usedCount / v.usageLimit) * 100))}%`,
                    height: '100%',
                    background: v.usedCount >= v.usageLimit ? '#e57373' : '#43a047',
                    transition: 'width 0.5s',
                  }} />
                </div>
                <span style={{ fontSize: 14, color: '#555', fontWeight: 600 }}>
                  {v.usedCount}/{v.usageLimit} lượt đã dùng
                </span>
              </>
            ) : (
              <span style={{ visibility: 'hidden' }}>placeholder</span>
            )}
          </div>
        </div>
          );
        })}
      </div>
    </div>
  );
};

export default VoucherSection;
