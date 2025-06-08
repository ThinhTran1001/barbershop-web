import React, { useState, useEffect } from 'react';
import { Card, message } from 'antd';
import FeedbackProductStats from '../../components/FeedbackProductStats';
import FeedbackProductFilters from '../../components/FeedbackProductFilters';
import FeedbackProductTable from '../../components/FeedbackProductTable';
import FeedbackProductModal from '../../components/FeedbackProductModal';
import { getAllFeedbacks, approveFeedback, deleteFeedback, unapprovalFeedback } from '../../services/api';
import dayjs from 'dayjs';
import './ManageFeedbackProduct.css';

const ManageFeedbackProduct = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState([]);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedbacks, searchValue, statusFilter, dateRange]); 

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await getAllFeedbacks();
      
      // Handle different response structures
      const feedbackData = res.data?.data || res.data || res || [];
      
      setFeedbacks(Array.isArray(feedbackData) ? feedbackData : []);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      message.error('Failed to load feedback data');
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!Array.isArray(feedbacks)) {
      setFilteredFeedbacks([]);
      return;
    }

    let filtered = [...feedbacks];

    if (searchValue) {
      filtered = filtered.filter(item =>
        item.comment?.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.userId?.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.productId?.name?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item =>
        statusFilter === 'approved' ? item.isApproved : !item.isApproved
      );
    }

    if (dateRange.length === 2) {
      const [start, end] = dateRange;
      filtered = filtered.filter(item => {
        const created = dayjs(item.createdAt);
        return created.isAfter(start.startOf('day')) && created.isBefore(end.endOf('day'));
      });
    }

    setFilteredFeedbacks(filtered);
  };

  const handleApproveFeedback = async (id) => {
    try {
      await approveFeedback(id);
      message.success('Feedback approved successfully');
      fetchFeedbacks();
    } catch (err) {
      console.error('Error approving feedback:', err);
      message.error('Có lỗi xảy ra khi duyệt feedback');
    }
  };

  const handleUnapprovalFeedback = async (id) => {
    try {
      await unapprovalFeedback(id);
      message.success('Feedback đã được hủy duyệt');
      fetchFeedbacks();
    } catch (err) {
      console.error('Error unapproving feedback:', err);
      message.error('Có lỗi xảy ra khi hủy duyệt feedback');
    }
  };

  const handleDeleteFeedback = async (id) => {
    try {
      await deleteFeedback(id);
      message.success('Feedback đã được xóa thành công');
      fetchFeedbacks();
    } catch (err) {
      console.error('Error deleting feedback:', err);
      message.error('Có lỗi xảy ra khi xóa feedback');
    }
  };

  const handleViewFeedback = (record) => {
    setSelectedFeedback(record);
    setViewModalVisible(true);
  };

  const stats = {
    total: feedbacks.length,
    approved: feedbacks.filter(f => f.isApproved).length,
    pending: feedbacks.filter(f => !f.isApproved).length
  };

  return (
    <div className="manage-feedback-container">
      <FeedbackProductStats stats={stats} />
      <Card>
        <FeedbackProductFilters
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          fetchFeedbacks={fetchFeedbacks}
          loading={loading}
        />
        <FeedbackProductTable
          filteredFeedbacks={filteredFeedbacks}
          loading={loading}
          handleViewFeedback={handleViewFeedback}
          approveFeedback={handleApproveFeedback}
          unapprovalFeedback={handleUnapprovalFeedback}
          deleteFeedback={handleDeleteFeedback}
        />
      </Card>
      <FeedbackProductModal
        visible={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        feedback={selectedFeedback}
      />
    </div>
  );
};

export default ManageFeedbackProduct;