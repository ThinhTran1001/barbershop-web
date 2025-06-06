import React, { useState, useEffect } from 'react';
import { Card, message, Modal } from 'antd';
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
import './ManageFeedbackBarber.css';

const ManageFeedbackBarber = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Statistics based on current data
  const stats = {
    total: feedbacks.length,
    approved: feedbacks.filter(fb => fb.isApproved).length,
    pending: feedbacks.filter(fb => !fb.isApproved).length
  };

  const fetchFeedbacks = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        status: statusFilter !== 'All' ? (statusFilter === 'Approved') : undefined,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
        ...params
      };

      Object.keys(queryParams).forEach(key => queryParams[key] === undefined && delete queryParams[key]);

      const response = await getBarberFeedbacks(queryParams);
      let feedbackData = [];
      let totalCount = 0;

      if (response.data) {
        if (Array.isArray(response.data)) {
          feedbackData = response.data;
          totalCount = response.data.length;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          feedbackData = response.data.data;
          totalCount = response.data.total || response.data.data.length;
        } else if (response.data.feedbacks && Array.isArray(response.data.feedbacks)) {
          feedbackData = response.data.feedbacks;
          totalCount = response.data.total || response.data.feedbacks.length;
        }
      } else if (Array.isArray(response)) {
        feedbackData = response;
        totalCount = response.length;
      }

      setFeedbacks(feedbackData);
      setPagination(prev => ({ ...prev, total: totalCount }));
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      if (error.response) {
        message.error(`Server error: ${error.response.data?.message || 'Internal Server Error'}`);
      } else if (error.request) {
        message.error('Cannot connect to the server');
      } else {
        message.error('An error occurred while loading data');
      }
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
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchFeedbacks({ page: 1 });
  }, [statusFilter, dateRange]);

  const handleRefresh = () => {
    fetchFeedbacks({ page: pagination.current, limit: pagination.pageSize });
    message.success('Data refreshed');
  };

  const toggleApproval = (record) => {
    Modal.confirm({
      title: `${record.isApproved ? 'Unapprove' : 'Approve'} this feedback?`,
      content: `Are you sure you want to ${record.isApproved ? 'unapprove' : 'approve'} this customer feedback?`,
      okText: 'Confirm',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await updateBarberFeedbackApproval(record._id, !record.isApproved);
          message.success(`${record.isApproved ? 'Unapproved' : 'Approved'} feedback successfully`);
          fetchFeedbacks({ page: pagination.current, limit: pagination.pageSize });
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
          message.error('Error updating status');
        }
      }
    });
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Delete feedback',
      content: 'Are you sure you want to delete this feedback?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteBarberFeedback(record._id);
          message.success('Feedback deleted successfully');
          fetchFeedbacks({ page: pagination.current, limit: pagination.pageSize });
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
          message.error('Error deleting feedback');
        }
      }
    });
  };

  const handleViewDetail = async (record) => {
    try {
      const response = await getBarberFeedbackById(record._id);
      let detail = response.data;
      if (response.data.data) {
        detail = response.data.data;
      }
      setSelectedFeedback(detail);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      message.error('Unable to load feedback details');
    }
  };

  const handleTableChange = (paginationConfig) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize
    }));
    fetchFeedbacks({ page: paginationConfig.current, limit: paginationConfig.pageSize });
  };

  return (
    <div className="manage-feedback-container">
      <div className="manage-feedback-inner">
        <FeedbackBarberStats stats={stats} />
        <FeedbackBarberFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          handleRefresh={handleRefresh}
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
          visible={!!selectedFeedback}
          onCancel={() => setSelectedFeedback(null)}
          feedback={selectedFeedback}
        />
      </div>
    </div>
  );
};

export default ManageFeedbackBarber;
