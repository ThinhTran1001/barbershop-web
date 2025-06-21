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

  const stats = {
    total: feedbacks.length,
    approved: feedbacks.filter(fb => fb.isApproved).length,
    pending: feedbacks.filter(fb => !fb.isApproved).length
  };

  const fetchFeedbacks = async (params = {}) => {
    setLoading(true);
    try {
      const page = params.page || 1;
      const limit = params.limit || pagination.pageSize;

      const queryParams = {
        page,
        limit,
        ...(statusFilter !== 'All' && { status: statusFilter.toLowerCase() }),
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
      message.error(error.response?.data?.message || 'Không thể tải phản hồi');
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
  }, [statusFilter, dateRange]);

  const handleRefresh = () => {
    fetchFeedbacks({ page: pagination.current, limit: pagination.pageSize });
    message.success('Dữ liệu đã được làm mới');
  };

  const toggleApproval = async (record) => {
    if (!record) return message.error('Dữ liệu phản hồi không hợp lệ');

    const feedbackId = record._id || record.id;
    if (!feedbackId) return message.error('ID phản hồi không hợp lệ');

    const newStatus = !record.isApproved;
    const action = newStatus ? 'duyệt' : 'bỏ duyệt';

    try {
      const response = await updateBarberFeedbackApproval(feedbackId, newStatus);
      if (response.status >= 200 && response.status < 300) {
        message.success(`Phản hồi đã được ${action} thành công`);
        await fetchFeedbacks({ page: pagination.current, limit: pagination.pageSize });
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Không thể ${action} phản hồi: ${error.message}`;
      message.error(errorMessage);
    }
  };

  const handleDelete = async (record) => {
    if (!record) return message.error('Dữ liệu phản hồi không hợp lệ');

    const feedbackId = record._id || record.id;
    if (!feedbackId) return message.error('ID phản hồi không hợp lệ');

    try {
      const response = await deleteBarberFeedback(feedbackId);
      if (response.status >= 200 && response.status < 300) {
        message.success('Phản hồi đã được xóa thành công');
        await fetchFeedbacks({ page: pagination.current, limit: pagination.pageSize });
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Không thể xóa phản hồi: ${error.message}`;
      message.error(errorMessage);
    }
  };

  const handleViewDetail = async (record) => {
    if (!record) return message.error('Dữ liệu phản hồi không hợp lệ');

    const feedbackId = record._id || record.id;
    if (!feedbackId) return message.error('ID phản hồi không hợp lệ');

    try {
      const response = await getBarberFeedbackById(feedbackId);
      const detail = response.data?.data || response.data;
      setSelectedFeedback(detail);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải chi tiết phản hồi';
      message.error(errorMessage);
    }
  };

  const handleTableChange = (paginationConfig) => {
    const { current, pageSize } = paginationConfig;
    setPagination(prev => ({ ...prev, current, pageSize }));
    fetchFeedbacks({ page: current, limit: pageSize });
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
          open={!!selectedFeedback}
          onCancel={() => setSelectedFeedback(null)}
          feedback={selectedFeedback}
        />
      </div>
    </div>
  );
};

export default ManageFeedbackBarber;
