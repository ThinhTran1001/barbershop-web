import React, { useState, useEffect } from 'react';
import { Card, message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
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

const { confirm } = Modal;

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

  // Calculate stats
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
        ...(ratingFilter !== 'All' && { rating: ratingFilter }),
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
      const data = Array.isArray(rawData?.data) ? rawData.data : Array.isArray(rawData) ? rawData : [];
      const total = rawData?.total || data.length;

      setFeedbacks(data);
      setPagination(prev => ({ ...prev, current: page, pageSize: limit, total }));
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      message.error('Failed to load feedbacks');
      setFeedbacks([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Reload when filters change
  useEffect(() => {
    fetchFeedbacks({ page: 1, limit: pagination.pageSize });
  }, [statusFilter, ratingFilter, barberFilter, bookingFilter, searchKeyword, dateRange]);

  const toggleApproval = async (record) => {
    if (!record?._id) {
      message.error('Invalid feedback data');
      return;
    }

    const newStatus = !record.isApproved;
    const action = newStatus ? 'approve' : 'unapprove';

    try {
      await updateBarberFeedbackApproval(record._id, newStatus);
      message.success(`Feedback ${action}d successfully`);
      fetchFeedbacks({ page: pagination.current, limit: pagination.pageSize });
    } catch (error) {
      console.error(`Error ${action}ing feedback:`, error);
      message.error(`Failed to ${action} feedback`);
    }
  };

  const handleDelete = (record) => {
    if (!record?._id) {
      message.error('Invalid feedback data');
      return;
    }

    confirm({
      title: 'Delete Feedback',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete this feedback? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteBarberFeedback(record._id);
          message.success('Feedback deleted successfully');
          fetchFeedbacks({ page: pagination.current, limit: pagination.pageSize });
        } catch (error) {
          console.error('Error deleting feedback:', error);
          message.error('Failed to delete feedback');
        }
      }
    });
  };

  const handleViewDetail = async (record) => {
    if (!record?._id) {
      message.error('Invalid feedback data');
      return;
    }

    try {
      const response = await getBarberFeedbackById(record._id);
      const detail = response.data?.data || response.data;
      setSelectedFeedback(detail);
    } catch (error) {
      console.error('Error loading feedback detail:', error);
      message.error('Failed to load feedback details');
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
        barbersList={[]} // You can pass actual barbers list here
        bookingsList={[]} // You can pass actual bookings list here
      />

      <Card>
        <FeedbackBarberTable
          feedbacks={feedbacks}
          loading={loading}
          pagination={pagination}
          handleTableChange={handleTableChange}
          handleViewDetail={handleViewDetail}
          toggleApproval={toggleApproval}
          handleDelete={handleDelete}
        />
      </Card>

      <FeedbackBarberModal
        open={!!selectedFeedback}
        onCancel={() => setSelectedFeedback(null)}
        feedback={selectedFeedback}
      />
    </div>
  );
};

export default ManageFeedbackBarber;