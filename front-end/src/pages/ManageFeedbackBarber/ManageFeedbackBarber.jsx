import React, { useState, useEffect } from 'react';
import { Card } from 'antd';
import { Modal, Button, Toast, ToastContainer } from 'react-bootstrap';
import { ExclamationTriangle } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import FeedbackBarberStats from '../../components/FeedbackBarberStats';
import FeedbackBarberFilters from '../../components/FeedbackBarberFilters';
import FeedbackBarberTable from '../../components/FeedbackBarberTable';
import FeedbackBarberModal from '../../components/FeedbackBarberModal';
import {
  getBarberFeedbacks,
  getBarberFeedbackById,
  deleteBarberFeedback,
  updateBarberFeedbackStatus
} from '../../services/api';

const ManageFeedbackBarber = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [barberFilter, setBarberFilter] = useState('All');
  const [bookingFilter, setBookingFilter] = useState('All');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);



  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  const showToast = (message, variant = 'success') => {
    setToast({ show: true, message, variant });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Tính toán filteredFeedbacks giống như bảng
  const filteredFeedbacks = React.useMemo(() => {
    let data = Array.isArray(feedbacks) ? feedbacks : [];
    if (statusFilter === 'Approved') data = data.filter(fb => fb.status === 'Approved');
    else if (statusFilter === 'Unapproved') data = data.filter(fb => fb.status === 'Unapproved');
    else if (statusFilter === 'Deleted') data = data.filter(fb => fb.isDeleted || String(fb.status) === 'Deleted');
    // Không loại bỏ feedback đã xóa ở filter All
    if (ratingFilter !== 'All') {
      data = data.filter(fb => {
        const rating = fb.rating || fb.stars || fb.score;
        return rating && parseInt(rating) === parseInt(ratingFilter);
      });
    }
    if (barberFilter !== 'All') {
      data = data.filter(fb => fb.barberId?._id === barberFilter);
    }
    if (bookingFilter !== 'All') {
      data = data.filter(fb => (fb.bookingId?._id || fb.bookingId) === bookingFilter);
    }
    if (searchKeyword?.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      data = data.filter(fb =>
        (fb.comment && fb.comment.toLowerCase().includes(keyword)) ||
        (fb.customerId?.name && fb.customerId.name.toLowerCase().includes(keyword))
      );
    }
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day');
      const end = dateRange[1].endOf('day');
      data = data.filter(fb => {
        const created = fb.createdAt ? new Date(fb.createdAt) : null;
        return created && created >= start.toDate() && created <= end.toDate();
      });
    }
    return data;
  }, [feedbacks, statusFilter, ratingFilter, barberFilter, bookingFilter, searchKeyword, dateRange]);

  // Hàm kiểm tra có đang filter không
  const isDefaultFilter =
    statusFilter === 'All' &&
    ratingFilter === 'All' &&
    barberFilter === 'All' &&
    bookingFilter === 'All' &&
    (!searchKeyword || searchKeyword.trim() === '') &&
    (!dateRange || !dateRange[0] || !dateRange[1]);

  // State lưu toàn bộ feedbacks để tính stats tổng quát
  const [allFeedbacks, setAllFeedbacks] = useState([]);

  // Fetch toàn bộ feedbacks khi load lần đầu hoặc khi cần thống kê tổng quát
  const fetchAllFeedbacks = async () => {
    try {
      const response = await getBarberFeedbacks({});
      const rawData = response.data;
      let data = Array.isArray(rawData?.data) ? rawData.data : Array.isArray(rawData) ? rawData : [];
      setAllFeedbacks(data);
    } catch (error) {
      setAllFeedbacks([]);
    }
  };

  useEffect(() => {
    fetchAllFeedbacks();
  }, []);

  // Stats đồng bộ enum
  const stats = React.useMemo(() => {
    return {
      total: filteredFeedbacks.length,
      approved: filteredFeedbacks.filter(fb => String(fb.status) === 'Approved').length,
      unapproved: filteredFeedbacks.filter(fb => String(fb.status) === 'Unapproved').length,
      deleted: filteredFeedbacks.filter(fb => fb.isDeleted || String(fb.status) === 'Deleted').length
    };
  }, [filteredFeedbacks]);

  const fetchFeedbacks = async (params = {}) => {
    setLoading(true);
    try {
      const page = params.page || pagination.current;
      const limit = params.limit || pagination.pageSize;

      let queryParams = {
        page,
        limit,
        ...(ratingFilter !== 'All' && { rating: parseInt(ratingFilter) }),
        ...(barberFilter !== 'All' && { barberId: barberFilter }),
        ...(bookingFilter !== 'All' && { bookingId: bookingFilter }),
        ...(searchKeyword?.trim() && { search: searchKeyword.trim() }),
        ...(dateRange && {
          startDate: dateRange[0]?.format('YYYY-MM-DD'),
          endDate: dateRange[1]?.format('YYYY-MM-DD')
        })
      };

      if (statusFilter === 'Approved') {
        queryParams.status = 'Approved';
      } else if (statusFilter === 'Unapproved') {
        queryParams.status = 'Unapproved';
      } else if (statusFilter === 'Deleted') {
        queryParams.status = 'Deleted';
      }

      const response = await getBarberFeedbacks(queryParams);
      const rawData = response.data;
      let data = Array.isArray(rawData?.data) ? rawData.data : Array.isArray(rawData) ? rawData : [];
      
      // Frontend filtering cho rating nếu backend không hỗ trợ
      if (ratingFilter !== 'All') {
        data = data.filter(fb => {
          const rating = fb.rating || fb.stars || fb.score;
          return rating && parseInt(rating) === parseInt(ratingFilter);
        });
      }
      
      const total = rawData?.total || data.length;

      setFeedbacks(data);
      setPagination(prev => ({ ...prev, current: page, pageSize: limit, total }));
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      showToast('Failed to load feedbacks', 'danger');
      setFeedbacks([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks({ page: 1, limit: pagination.pageSize });
  }, [statusFilter, ratingFilter, barberFilter, bookingFilter, searchKeyword, dateRange]);

  // Lấy danh sách barber duy nhất từ feedbacks
  const uniqueBarbers = React.useMemo(() => {
    const map = new Map();
    feedbacks.forEach(fb => {
      if (fb.barberId && fb.barberId.userId && fb.barberId.userId.name) {
        map.set(fb.barberId._id, {
          _id: fb.barberId._id,
          name: fb.barberId.userId.name
        });
      }
    });
    return Array.from(map.values());
  }, [feedbacks]);

  // Lấy danh sách booking duy nhất từ feedbacks
  const uniqueBookings = React.useMemo(() => {
    const map = new Map();
    feedbacks.forEach(fb => {
      const booking = fb.bookingId;
      if (booking) {
        let label = '';
        if (booking.bookingDate) label = new Date(booking.bookingDate).toLocaleString();
        else if (booking.name) label = booking.name;
        else if (booking.title) label = booking.title;
        else if (booking._id) label = booking._id.slice(0, 8) + '...';
        else if (typeof booking === 'string') label = booking.slice(0, 8) + '...';
        else label = 'Unknown Booking';
        map.set(booking._id || booking, {
          _id: booking._id || booking,
          label
        });
      }
    });
    return Array.from(map.values());
  }, [feedbacks]);


  const handleDelete = (record) => {
    if (!record?._id) {
      showToast('Invalid feedback data', 'danger');
      return;
    }
    setItemToDelete(record);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete?._id) return;

    try {
      await deleteBarberFeedback(itemToDelete._id);
      showToast('Feedback deleted successfully', 'success');
      fetchFeedbacks({ page: pagination.current, limit: pagination.pageSize });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      showToast('Failed to delete feedback', 'danger');
    } finally {
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleViewDetail = async (record) => {
    if (!record?._id) {
      showToast('Invalid feedback data', 'danger');
      return;
    }

    try {
      const response = await getBarberFeedbackById(record._id);
      const detail = response.data?.data || response.data;
      setSelectedFeedback(detail);
    } catch (error) {
      console.error('Error loading feedback detail:', error);
      showToast('Failed to load feedback details', 'danger');
    }
  };

  // Hàm cập nhật trạng thái feedback barber
  const handleSetStatus = async (record, status) => {
    try {
      await updateBarberFeedbackStatus(record._id, status);
      setToast({ show: true, message: 'Feedback status updated!', variant: 'success' });
      await fetchFeedbacks();
      await fetchAllFeedbacks(); // Đảm bảo thống kê luôn cập nhật
      if (selectedFeedback && selectedFeedback._id === record._id) {
        try {
          const response = await getBarberFeedbackById(record._id);
          const detail = response.data?.data || response.data;
          setSelectedFeedback(detail);
        } catch {
          setSelectedFeedback(null);
        }
      }
    } catch (err) {
      setToast({ show: true, message: 'Error updating feedback status!', variant: 'danger' });
    }
  };

  const toggleApproval = async (record) => {
    try {
      await updateBarberFeedbackStatus(record._id, !record.isApproved);
      showToast('Cập nhật trạng thái thành công!');
      fetchFeedbacks();
      if (selectedFeedback && selectedFeedback._id === record._id) {
        setSelectedFeedback({ ...selectedFeedback, isApproved: !record.isApproved });
      }
    } catch (err) {
      showToast('Có lỗi khi cập nhật trạng thái!');
    }
  };

  const handleTableChange = (paginationConfig) => {
    const { current, pageSize } = paginationConfig;
    setPagination(prev => ({ ...prev, current, pageSize }));
    fetchFeedbacks({ page: current, limit: pageSize });
  };

  return (
    <>
      <FeedbackBarberStats stats={stats} />

      <div className="fb-table-wrapper">
        <FeedbackBarberFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          ratingFilter={ratingFilter}
          setRatingFilter={setRatingFilter}
          barberFilter={barberFilter}
          setBarberFilter={setBarberFilter}
          bookingFilter={bookingFilter}
          setBookingFilter={setBookingFilter}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          dateRange={dateRange}
          setDateRange={setDateRange}
          barbers={uniqueBarbers}
          bookings={uniqueBookings}
        />
        <div className="fb-table-responsive">
          <FeedbackBarberTable
            filteredFeedbacks={filteredFeedbacks}
            loading={loading}
            handleViewFeedback={handleViewDetail}
            handleSetStatus={handleSetStatus}
          />
        </div>
      </div>

      <FeedbackBarberModal
        open={!!selectedFeedback}
        onCancel={() => setSelectedFeedback(null)}
        feedback={selectedFeedback}
      />

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <ExclamationTriangle className="text-warning me-2" />
            Delete Feedback
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this feedback? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Yes, Delete</Button>
        </Modal.Footer>
      </Modal>



      <ToastContainer position="top-end" className="p-3">
        <Toast show={toast.show} bg={toast.variant} onClose={() => setToast({ ...toast, show: false })} delay={3000} autohide>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default ManageFeedbackBarber;