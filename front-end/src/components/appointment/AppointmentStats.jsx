import React, { useEffect, useState } from 'react';
import { getBookingStats } from '../../services/api';
import { Spin } from 'antd';

const AppointmentStats = () => {
  const [stats, setStats] = useState({ upcoming: 0, past: 0, cancelled: 0, totalCustomer: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getBookingStats()
      .then(res => setStats(res.data || { upcoming: 0, past: 0, cancelled: 0, totalCustomer: 0 }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" /></div>;

  return (
    <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
      <div style={{ flex: 1, background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, minWidth: 180 }}>
        <div style={{ fontSize: 16, color: '#888', marginBottom: 8 }}>Upcoming Appointment</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#2D2DFF' }}>{stats.upcoming}</div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, minWidth: 180 }}>
        <div style={{ fontSize: 16, color: '#888', marginBottom: 8 }}>Past Appointment</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#6C47FF' }}>{stats.past}</div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, minWidth: 180 }}>
        <div style={{ fontSize: 16, color: '#888', marginBottom: 8 }}>Cancel Appointment</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#B266FF' }}>{stats.cancelled}</div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, minWidth: 180 }}>
        <div style={{ fontSize: 16, color: '#888', marginBottom: 8 }}>Total Customer</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#00C896' }}>{stats.totalCustomer}</div>
      </div>
    </div>
  );
};

export default AppointmentStats; 