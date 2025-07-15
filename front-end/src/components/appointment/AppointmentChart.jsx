import React, { useEffect, useState } from 'react';
// import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button, DatePicker, Spin } from 'antd';
import { getBookingChartStats } from '../../services/api';

const { RangePicker } = DatePicker;

// Tổng hợp trạng thái từ toàn bộ chartData
const getPieDataFromChartData = (chartData) => {
  const statusCount = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  chartData.forEach(group => {
    statusCount.pending += group.pending || 0;
    statusCount.confirmed += group.confirmed || 0;
    statusCount.completed += group.completed || 0;
    statusCount.cancelled += group.cancelled || 0;
  });
  const total = Object.values(statusCount).reduce((a, b) => a + b, 0);
  const colors = {
    pending: '#FFD600',
    confirmed: '#6C47FF',
    completed: '#00C896',
    cancelled: '#FF4D4F'
  };
  return Object.entries(statusCount)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0,
      color: colors[status]
    }));
};

const AppointmentChart = ({ chartRange, chartMode, onChartRangeChange, onChartModeChange }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chartRange || !chartRange[0] || !chartRange[1]) return;
    setLoading(true);
    getBookingChartStats({
      from: chartRange[0].startOf('day').toISOString(),
      to: chartRange[1].endOf('day').toISOString(),
      mode: chartMode
    })
      .then(res => setChartData(Array.isArray(res.data.data) ? res.data.data : []))
      .finally(() => setLoading(false));
  }, [chartRange, chartMode]);

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 18 }}>Appointment Stats</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button.Group style={{ marginBottom: 16 }}>
            <Button type={chartMode === 'day' ? 'primary' : 'default'} onClick={() => onChartModeChange('day')}>Day</Button>
            <Button type={chartMode === 'week' ? 'primary' : 'default'} onClick={() => onChartModeChange('week')}>Week</Button>
            <Button type={chartMode === 'month' ? 'primary' : 'default'} onClick={() => onChartModeChange('month')}>Month</Button>
            <Button type={chartMode === 'year' ? 'primary' : 'default'} onClick={() => onChartModeChange('year')}>Year</Button>
          </Button.Group>
          <RangePicker
            value={chartRange}
            onChange={onChartRangeChange}
            allowClear={false}
            style={{ minWidth: 260 }}
            format="DD/MM/YYYY"
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 2 }}>
          {loading ? (
            <div className="text-center my-5"><Spin size="large" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                barCategoryGap="20%"
                barGap={2}
              >
                <XAxis dataKey={chartMode === 'day' ? 'time' : chartMode === 'year' ? 'month' : 'date'} tickFormatter={v => v} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="pending" fill="#FFD600" name="Pending" />
                <Bar dataKey="confirmed" fill="#6C47FF" name="Confirmed" />
                <Bar dataKey="completed" fill="#00C896" name="Completed" />
                <Bar dataKey="cancelled" fill="#FF4D4F" name="Cancelled" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 350 }}>
          <div style={{ textAlign: 'center', marginBottom: 16, fontWeight: 600, fontSize: 16 }}>
            Status Distribution
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getPieDataFromChartData(chartData)}
                cx="50%"
                cy="50%"
                outerRadius={65}
                dataKey="value"
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                labelLine={true}
              >
                {getPieDataFromChartData(chartData).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [
                `${value} bookings (${props.payload.percentage}%)`,
                name
              ]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AppointmentChart; 