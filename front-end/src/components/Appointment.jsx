import React, { useEffect, useState, useCallback } from 'react';
import { Input, Button, Select, Table, message, Spin, Modal, DatePicker, Avatar } from 'antd';
import { getAllBookings, getBookingDetail, getBookingStats, getAllBarber, getAllServices } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import debounce from 'lodash.debounce';
import { SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import axios from 'axios'; // Thêm axios để gọi API chart-stats
import AppointmentStats from './appointment/AppointmentStats';
import AppointmentChart from './appointment/AppointmentChart';
import AppointmentTable from './appointment/AppointmentTable';
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

const { Option } = Select;
const { RangePicker } = DatePicker;

function groupBookings(data, startDate, endDate, mode) {
  if (mode === 'day') {
    // Group by hour in selected day
    const hours = Array.from({ length: 10 }, (_, i) => 8 + i); // 8h đến 17h
    const hourLabels = hours.map(h => `${h}:00`);
    // Lấy ngày được chọn (nếu range là 1 ngày, lấy ngày đó, nếu nhiều ngày, lấy ngày đầu tiên)
    const selectedDay = dayjs(startDate).format('YYYY-MM-DD');
    return hourLabels.map((hourLabel, idx) => {
      const bookingsInHour = data.filter(b => {
        const d = dayjs(b.bookingDate);
        return d.format('YYYY-MM-DD') === selectedDay && d.hour() === hours[idx];
      });
      return {
        time: hourLabel,
        pending: bookingsInHour.filter(b => b.status === 'pending').length,
        confirmed: bookingsInHour.filter(b => b.status === 'confirmed').length,
        completed: bookingsInHour.filter(b => b.status === 'completed').length,
        cancelled: bookingsInHour.filter(b => b.status === 'cancelled' || b.status === 'no_show').length,
      };
    });
  } else if (mode === 'week') {
    // Group by 7 days in week
    const days = [];
    let d = dayjs(startDate).startOf('isoWeek');
    for (let i = 0; i < 7; i++) {
      days.push(d.add(i, 'day').format('YYYY-MM-DD'));
    }
    return days.map(date => {
      const bookingsInDay = data.filter(b => dayjs(b.bookingDate).format('YYYY-MM-DD') === date);
      return {
        date,
        pending: bookingsInDay.filter(b => b.status === 'pending').length,
        confirmed: bookingsInDay.filter(b => b.status === 'confirmed').length,
        completed: bookingsInDay.filter(b => b.status === 'completed').length,
        cancelled: bookingsInDay.filter(b => b.status === 'cancelled' || b.status === 'no_show').length,
      };
    });
  } else if (mode === 'month') {
    // Group by 30-31 days in month
    const daysInMonth = dayjs(startDate).daysInMonth();
    const month = dayjs(startDate).format('YYYY-MM');
    const days = Array.from({ length: daysInMonth }, (_, i) => dayjs(month + '-01').add(i, 'day').format('YYYY-MM-DD'));
    return days.map(date => {
      const bookingsInDay = data.filter(b => dayjs(b.bookingDate).format('YYYY-MM-DD') === date);
      return {
        date,
        pending: bookingsInDay.filter(b => b.status === 'pending').length,
        confirmed: bookingsInDay.filter(b => b.status === 'confirmed').length,
        completed: bookingsInDay.filter(b => b.status === 'completed').length,
        cancelled: bookingsInDay.filter(b => b.status === 'cancelled' || b.status === 'no_show').length,
      };
    });
  } else if (mode === 'year') {
    // Group by 12 months
    const year = dayjs(startDate).year();
    const months = Array.from({ length: 12 }, (_, i) => dayjs(`${year}-01-01`).add(i, 'month').format('YYYY-MM'));
    return months.map(month => {
      const bookingsInMonth = data.filter(b => dayjs(b.bookingDate).format('YYYY-MM') === month);
      return {
        date: month,
        pending: bookingsInMonth.filter(b => b.status === 'pending').length,
        confirmed: bookingsInMonth.filter(b => b.status === 'confirmed').length,
        completed: bookingsInMonth.filter(b => b.status === 'completed').length,
        cancelled: bookingsInMonth.filter(b => b.status === 'cancelled' || b.status === 'no_show').length,
      };
    });
  }
  return [];
}

// Calculate status distribution for pie chart
const calculateStatusDistribution = (bookings) => {
  const statusCount = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0
  };

  bookings.forEach(booking => {
    if (statusCount.hasOwnProperty(booking.status)) {
      statusCount[booking.status]++;
    }
  });

  const total = bookings.length;
  const colors = {
    pending: '#FFD600',
    confirmed: '#6C47FF',
    completed: '#00C896',
    cancelled: '#FF4D4F',
    no_show: '#FF7875'
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

const Appointment = () => {
  const [data, setData] = useState([]); // toàn bộ booking
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState();
  const [barberId, setBarberId] = useState();
  const [serviceId, setServiceId] = useState();
  const [barbers, setBarbers] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stats, setStats] = useState({ upcoming: 0, past: 0, cancelled: 0, totalCustomer: 0 });
  const [range, setRange] = useState([dayjs().subtract(6, 'day'), dayjs()]); // 7 ngày gần nhất
  const [chartMode, setChartMode] = useState('day'); // 'day', 'week', 'month', 'year'
  const [type, setType] = useState('all');
  const [sorter, setSorter] = useState({ field: 'bookingDate', order: 'descend' });

  // State cho chart
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartRange, setChartRange] = useState([dayjs().subtract(6, 'day'), dayjs()]);

  const debouncedSetSearch = useCallback(
    debounce((value) => setSearch(value), 400),
    []
  );

  // Fetch all bookings 1 lần duy nhất
  // useEffect(() => {
  //   getAllBookings().then(res => setData(res.data.data || []));
  // }, []);
  

  // Filter, search, sort client-side
  useEffect(() => {
    let filtered = [...data];
    if (search) filtered = filtered.filter(b =>
      (b.customerName || b.customerId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.customerPhone || b.customerId?.phone || '').toLowerCase().includes(search.toLowerCase())
    );
    if (status) filtered = filtered.filter(b => b.status === status);
    if (barberId) filtered = filtered.filter(b => b.barberId?._id === barberId);
    if (serviceId) filtered = filtered.filter(b => b.serviceId?._id === serviceId);
    // TODO: sort nếu cần
    setFilteredData(filtered);
    setCurrentPage(1); // reset về trang 1 khi filter
  }, [data, search, status, barberId, serviceId]);

  // Fetch barbers for filter dropdown
  const fetchBarbers = async () => {
    try {
      const res = await getAllBarber();
      setBarbers(res.data || []);
    } catch (err) {
      console.error('Error fetching barbers:', err);
    }
  };

  // Generate unique services from booking data
  const uniqueServices = Array.from(
    new Map(
      data
        .filter(b => b.serviceId && b.serviceId._id)
        .map(b => [b.serviceId._id, b.serviceId])
    ).values()
  );

  // Gọi API getAllBookings với search và status
  const fetchBookings = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        search,
        status,
        barberId,
        serviceId,
        page: params.page || pagination.current,
        limit: params.limit || pagination.pageSize,
        ...params,
      };
      if (sorter.field && sorter.order) {
        query.sortBy = sorter.field;
        query.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
      }
      const res = await getAllBookings(query);
      const bookingsData = res.data?.data || res.data?.bookings || res.data || [];
      const totalCount = res.data?.total || res.total || 0;
      setData(bookingsData);
      setPagination(p => ({
        ...p,
        total: totalCount,
        current: params.page || p.current,
        pageSize: params.limit || p.pageSize,
      }));
    } catch (err) {
      message.error('Lỗi khi tải danh sách booking');
    } finally {
      setLoading(false);
    }
  };

  // Fetch chart data riêng
  const fetchChartData = async () => {
    setChartLoading(true);
    try {
      const from = chartRange[0].startOf('day').toISOString();
      const to = chartRange[1].endOf('day').toISOString();
      console.log('Chart API params:', { from, to, mode: chartMode });
      const res = await axios.get('/api/bookings/chart-stats', {
        params: { from, to, mode: chartMode }
      });
      console.log('Chart API data:', res.data.data);
      setChartData(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      setChartData([]);
      console.error('Chart API error:', err);
    } finally {
      setChartLoading(false);
    }
  };

  // Khi pagination thay đổi (user bấm chuyển trang), gọi fetchBookings
  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line
  }, [pagination.current, pagination.pageSize]);

  // Khi chart mode hoặc date range thay đổi, fetch chart data
  useEffect(() => {
    fetchChartData();
    // eslint-disable-next-line
  }, [chartRange, chartMode]);

  const fetchStats = async () => {
    try {
      const res = await getBookingStats();
      setStats(res.data || { upcoming: 0, past: 0, cancelled: 0, totalCustomer: 0 });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({ upcoming: 0, past: 0, cancelled: 0, totalCustomer: 0 });
    }
  };

  const handleViewDetail = async (bookingId) => {
    setDetailLoading(true);
    try {
      const res = await getBookingDetail(bookingId);
      setSelectedBooking(res.data);
      setIsDetailModalVisible(true);
    } catch (err) {
      console.error('Error fetching booking detail:', err);
      message.error('Lỗi khi tải chi tiết booking');
    } finally {
      setDetailLoading(false);
    }
  };

  // Area chart data
  const areaData = groupBookings(data, range[0], range[1], chartMode);

  // Table columns
  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (_, rec) => {
        const name = rec.customerName || rec.customerId?.name || '';
        const avatarUrl = rec.customerId?.avatar || null;
        return (
          <Avatar src={avatarUrl} alt={name}>
            {(!avatarUrl && name) ? name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
        );
      },
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (_, rec) => <span style={{ fontWeight: 600 }}>{rec.customerName || rec.customerId?.name || 'N/A'}</span>,
    },
    {
      title: 'Barber Name',
      dataIndex: 'barberName',
      key: 'barberName',
      render: (_, rec) => <span style={{ fontWeight: 600 }}>{rec.barberId?.userId?.name || 'N/A'}</span>,
    },
    {
      title: 'Phone',
      dataIndex: 'customerPhone',
      key: 'customerPhone',
      render: (_, rec) => rec.customerPhone || rec.customerId?.phone || 'N/A',
    },
    {
      title: 'Date',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      render: v => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: v => {
        let color = '#FFD600', border = '#FFD600', bg = '#FFFBE6';
        let text = v ? v.charAt(0).toUpperCase() + v.slice(1) : 'N/A';
        if (v === 'confirmed') { color = '#6C47FF'; border = '#6C47FF'; bg = '#F0F5FF'; }
        else if (v === 'completed') { color = '#00C896'; border = '#00C896'; bg = '#F6FFED'; }
        else if (v === 'cancelled' || v === 'no_show') { color = '#FF4D4F'; border = '#FF4D4F'; bg = '#FFF1F0'; }
        return (
          <span style={{
            color,
            border: `1.5px solid ${border}`,
            background: bg,
            borderRadius: 6,
            padding: '2px 12px',
            fontWeight: 600,
            display: 'inline-block',
            minWidth: 70,
            textAlign: 'center'
          }}>
            {text}
          </span>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => handleViewDetail(record._id)}
          loading={detailLoading}
        >
          View
        </Button>
      )
    },
  ];


  // Table onChange để sort và phân trang
  const handleTableChange = (paginationConfig, filters, sorterObj) => {
    console.log('Table change:', { paginationConfig, filters, sorterObj });

    // Cập nhật pagination
    setPagination(p => ({
      ...p,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize
    }));

    // Cập nhật sorter
    if (sorterObj && sorterObj.field) {
      if (sorterObj.field === 'customerName') {
        setSorter({ field: 'customerName', order: sorterObj.order });
      } else if (sorterObj.field === 'bookingDate') {
        setSorter({ field: 'bookingDate', order: sorterObj.order });
      } else {
        setSorter({ field: sorterObj.field, order: sorterObj.order });
      }
    }
  };

  // Debounce search input
  const handleSearchChange = (e) => {
    debouncedSetSearch(e.target.value);
  };

  // Handle status filter change
  const handleStatusChange = (value) => {
    setStatus(value);
  };

  // Handle date range change
  const handleRangeChange = (dates) => {
    if (dates) {
      setRange(dates);
    }
  };

  // Handle barber filter change
  const handleBarberChange = (value) => {
    setBarberId(value);
  };

  // Handle service filter change
  const handleServiceChange = (value) => {
    setServiceId(value);
  };

  // Update handleSort to only allow 2 states (asc/desc)
  const handleSort = (field) => {
    if (sorter.field !== field) {
      setSorter({ field, order: 'ascend' });
    } else {
      setSorter({ field, order: sorter.order === 'ascend' ? 'descend' : 'ascend' });
    }
  };

  return (
    <div className="container mt-4">
      {/* Stats Cards */}
      <AppointmentStats />

      {/* Chart Section */}
      <AppointmentChart
        chartRange={chartRange}
        chartMode={chartMode}
        onChartRangeChange={dates => setChartRange(dates)}
        onChartModeChange={setChartMode}
      />

      {/* Search and Filter Controls */}
      <div className="mb-3 d-flex align-items-center" style={{ gap: 10, flexWrap: 'wrap' }}>
        <Input
          placeholder="Search by name, phone..."
          onChange={e => debouncedSetSearch(e.target.value)}
          allowClear
          style={{ width: 220, marginRight: 8 }}
        />
        <Select
          placeholder="Status"
          style={{ width: 150 }}
          allowClear
          value={status}
          onChange={handleStatusChange}
        >
          <Option value="pending">Pending</Option>
          <Option value="confirmed">Confirmed</Option>
          <Option value="cancelled">Cancelled</Option>
          <Option value="completed">Completed</Option>
        </Select>
        <Select
          placeholder="Filter by Barber"
          style={{ width: 200 }}
          allowClear
          value={barberId}
          onChange={handleBarberChange}
        >
          {barbers.map(barber => (
            <Option key={barber._id} value={barber._id}>
              {barber.userId?.name || 'N/A'}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Filter by Service"
          style={{ width: 200 }}
          allowClear
          value={serviceId}
          onChange={handleServiceChange}
        >
          {uniqueServices.map(service => (
            <Option key={service._id} value={service._id}>
              {service.name}
            </Option>
          ))}
        </Select>
      </div>

      {/* Table Section */}
      <AppointmentTable
        search={search}
        status={status}
        barberId={barberId}
        serviceId={serviceId}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        columns={columns}
      />

      {/* Detail Modal */}
      <Modal
        title="Booking Detail"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {detailLoading ? (
          <div className="text-center"><Spin /></div>
        ) : selectedBooking ? (
          <div>
            <p><strong>Customer:</strong> {selectedBooking.customerName || selectedBooking.customerId?.name || 'N/A'}</p>
            <p><strong>Phone:</strong> {selectedBooking.customerPhone || selectedBooking.customerId?.phone || 'N/A'}</p>
            <p><strong>Email:</strong> {selectedBooking.customerEmail || selectedBooking.customerId?.email || 'N/A'}</p>
            <p><strong>Service:</strong> {selectedBooking.serviceId?.name || 'N/A'}</p>
            <p><strong>Barber:</strong> {selectedBooking.barberId?.userId?.name || 'N/A'}</p>
            <p><strong>Date:</strong> {selectedBooking.bookingDate ? dayjs(selectedBooking.bookingDate).format('DD/MM/YYYY HH:mm') : 'N/A'}</p>
            <p><strong>Duration:</strong> {selectedBooking.durationMinutes || 0} minutes</p>
            <p><strong>Status:</strong> {selectedBooking.status || 'N/A'}</p>
            {selectedBooking.note && <p><strong>Note:</strong> {selectedBooking.note}</p>}
          </div>
        ) : (
          <p>No booking data available</p>
        )}
      </Modal>
    </div>
  );
};

export default Appointment;