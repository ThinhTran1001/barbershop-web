import React, { useEffect, useState } from 'react';
import axios from 'axios';

const VoucherLanding = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 32 }}>ƯU ĐÃI DÀNH CHO BẠN</h2>
      {loading && <p>Đang tải...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && vouchers.length === 0 && <p>Hiện chưa có voucher nào khả dụng.</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
        {vouchers.map((v) => (
          <div key={v._id || v.code} style={{ border: '1px solid #eee', borderRadius: 12, padding: 20, minWidth: 260, background: '#fff', boxShadow: '0 2px 8px #eee' }}>
            <h3 style={{ color: '#d4af37', marginBottom: 8 }}>{v.code}</h3>
            <div style={{ marginBottom: 8 }}>
              <b>Loại:</b> {v.type === 'percent' ? `Giảm ${v.value}%` : `Giảm ${v.value.toLocaleString()} VND`}
            </div>
            {v.maxDiscountAmount > 0 && v.type === 'percent' && (
              <div style={{ marginBottom: 8 }}>
                <b>Giảm tối đa:</b> {v.maxDiscountAmount.toLocaleString()} VND
              </div>
            )}
            {v.minOrderAmount > 0 && (
              <div style={{ marginBottom: 8 }}>
                <b>Đơn tối thiểu:</b> {v.minOrderAmount.toLocaleString()} VND
              </div>
            )}
            <div style={{ marginBottom: 8 }}>
              <b>Hạn dùng:</b> {new Date(v.endDate).toLocaleDateString('vi-VN')}
            </div>
            {v.description && <div style={{ marginBottom: 8 }}>{v.description}</div>}
            <button style={{ background: '#222', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', marginTop: 8 }} onClick={() => window.location.href = '/login'}>
              Đăng nhập để sử dụng
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoucherLanding; 