# Dashboard Setup Guide

## 📊 Admin Booking Dashboard

Trang Appointment đã được chuyển đổi thành Dashboard quản lý toàn diện với các tính năng:

### ✅ Features Implemented

1. **KPI/Stats Overview**
   - Booking hôm nay
   - Số booking hoàn thành/chờ/hủy
   - Doanh thu hôm nay/tuần/tháng
   - Tổng khách hàng
   - Số barber hoạt động

2. **Today's Bookings Table**
   - Danh sách booking hôm nay
   - Thông tin khách hàng, dịch vụ, barber
   - Trạng thái và giá

3. **Charts & Analytics**
   - Biểu đồ doanh thu 30 ngày
   - Biểu đồ booking 7 ngày
   - Hiệu suất barber

4. **Top Performers**
   - Khách hàng thân thiết
   - Barber xuất sắc

5. **Advanced Filters**
   - Lọc theo thời gian, barber, dịch vụ, trạng thái
   - Tìm kiếm nhanh

### 🔧 Setup Required

#### Install Chart Library
```bash
npm install @ant-design/plots
```

#### Enable Charts
Uncomment the import in `Appointment.jsx`:
```javascript
// Change this:
// import { Line, Column, Pie } from '@ant-design/plots';

// To this:
import { Line, Column, Pie } from '@ant-design/plots';
```

Then replace the placeholder chart components with actual charts:

```javascript
// Revenue Chart
<Line
  data={dashboardData.revenueChart}
  xField="date"
  yField="revenue"
  smooth={true}
  color="#1890ff"
  point={{ size: 3 }}
  height={300}
/>

// Booking Chart
<Column
  data={dashboardData.bookingChart}
  xField="date"
  yField="bookings"
  color="#52c41a"
  height={300}
/>
```

### 📁 File Structure

```
front-end/src/components/
├── Appointment.jsx          # Main dashboard component
├── appointment/
│   ├── AppointmentStats.jsx # Legacy stats (can be removed)
│   ├── AppointmentChart.jsx # Legacy chart (can be removed)
│   └── AppointmentTable.jsx # Legacy table (can be removed)
```

### 🎯 Usage

The dashboard automatically loads when accessing `/admin/appointment` route.

All data is fetched from existing APIs:
- `getAllBookings()` - For booking data
- `getBookingStats()` - For statistics
- `getAllBarber()` - For barber list
- `getAllServices()` - For service list

### 🔄 Data Flow

1. **Load Dashboard Data**: Fetches bookings and stats
2. **Process KPIs**: Calculates metrics from raw data
3. **Generate Charts**: Creates chart data arrays
4. **Render Components**: Displays all sections

### 🎨 Customization

You can customize:
- Colors in KPI cards
- Chart configurations
- Table columns
- Filter options
- Layout spacing

### 🚀 Next Steps

1. Install @ant-design/plots
2. Enable chart imports
3. Test with real data
4. Customize styling if needed
5. Add more metrics as required
