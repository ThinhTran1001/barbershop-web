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
  updateBarberFeedbackApproval,
  deleteBarberFeedback
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

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [itemToToggle, setItemToToggle] = useState(null);

  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  const showToast = (message, variant = 'success') => {
    setToast({ show: true, message, variant });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const stats = {
    total: feedbacks.length,
    approved: feedbacks.filter(fb => fb.isApproved).length,
    pending: feedbacks.filter(fb => !fb.isApproved).length
  };

  const fetchFeedbacks = async (params = {}) => {
    setLoading(true);
    try {
      const page = params.page || pagination.current;
      const limit = params.limit || pagination.pageSize;

      const queryParams = {
        page,
        limit,
        ...(statusFilter !== 'All' && { status: statusFilter.toLowerCase() }),
        ...(ratingFilter !== 'All' && { rating: parseInt(ratingFilter) }),
        ...(barberFilter !== 'All' && { barberId: barberFilter }),
        ...(bookingFilter !== 'All' && { bookingId: bookingFilter }),
        ...(searchKeyword?.trim() && { search: searchKeyword.trim() }),
        ...(dateRange && {
          startDate: dateRange[0]?.format('YYYY-MM-DD'),
          endDate: dateRange[1]?.format('YYYY-MM-DD')
        })
      };

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
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    fetchFeedbacks({ page: 1, limit: pagination.pageSize });
  }, [statusFilter, ratingFilter, barberFilter, bookingFilter, searchKeyword, dateRange]);

  const handleToggleApproval = (record) => {
    if (!record?._id) {
      showToast('Invalid feedback data', 'danger');
      return;
    }
    setItemToToggle(record);
    setShowApproveModal(true);
  };

  const confirmToggleApproval = async () => {
    if (!itemToToggle?._id) return;

    const newStatus = !itemToToggle.isApproved;
    const action = newStatus ? 'approved' : 'unapproved';

    try {
      await updateBarberFeedbackApproval(itemToToggle._id, newStatus);
      showToast(`Feedback ${action} successfully`, 'success');
      fetchFeedbacks({ page: pagination.current, limit: pagination.pageSize });
    } catch (error) {
      console.error(`Error ${action} feedback:`, error);
      showToast(`Failed to ${action} feedback`, 'danger');
    } finally {
      setItemToToggle(null);
      setShowApproveModal(false);
    }
  };

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

  const handleTableChange = (paginationConfig) => {
    const { current, pageSize } = paginationConfig;
    setPagination(prev => ({ ...prev, current, pageSize }));
    fetchFeedbacks({ page: current, limit: pageSize });
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <FeedbackBarberStats stats={stats} />

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
        barbersList={[]}
        bookingsList={[]}
      />

      <Card>
        <FeedbackBarberTable
          feedbacks={feedbacks}
          loading={loading}
          pagination={pagination}
          handleTableChange={handleTableChange}
          handleViewDetail={handleViewDetail}
          toggleApproval={handleToggleApproval}
          handleDelete={handleDelete}
        />
      </Card>

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

      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <ExclamationTriangle className="text-warning me-2" />
            {itemToToggle?.isApproved ? 'Unapprove' : 'Approve'} Feedback
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to {itemToToggle?.isApproved ? 'unapprove' : 'approve'} this feedback?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={confirmToggleApproval}>
            Yes, {itemToToggle?.isApproved ? 'Unapprove' : 'Approve'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast show={toast.show} bg={toast.variant} onClose={() => setToast({ ...toast, show: false })} delay={3000} autohide>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default ManageFeedbackBarber;