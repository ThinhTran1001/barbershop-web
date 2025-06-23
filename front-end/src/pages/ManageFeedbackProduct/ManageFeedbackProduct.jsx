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
  const [ratingFilter, setRatingFilter] = useState(null);
  const [productFilter, setProductFilter] = useState(null);
  const [products, setProducts] = useState([]);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedbacks, searchValue, statusFilter, dateRange, ratingFilter, productFilter]); 

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await getAllFeedbacks();
      
      // Handle different response structures
      const feedbackData = res.data?.data || res.data || res || [];
      
      setFeedbacks(Array.isArray(feedbackData) ? feedbackData : []);
      
      // Extract unique products from feedbacks for product filter
      if (Array.isArray(feedbackData) && feedbackData.length > 0) {
        const uniqueProducts = [];
        const productIds = new Set();
        
        feedbackData.forEach(feedback => {
          if (feedback.productId && feedback.productId._id && !productIds.has(feedback.productId._id)) {
            productIds.add(feedback.productId._id);
            uniqueProducts.push({
              _id: feedback.productId._id,
              name: feedback.productId.name || 'Unknown Product'
            });
          }
        });
        
        setProducts(uniqueProducts);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      message.error('Failed to load feedback data');
      setFeedbacks([]);
      setProducts([]);
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

    // Search functionality - search by comment, user name, product name
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(item =>
        item.comment?.toLowerCase().includes(searchLower) ||
        item.userId?.name?.toLowerCase().includes(searchLower) ||
        item.productId?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item =>
        statusFilter === 'approved' ? item.isApproved : !item.isApproved
      );
    }

    // Rating filter - filter by star rating
    if (ratingFilter !== null) {
      filtered = filtered.filter(item => item.rating === ratingFilter);
    }

    // Product filter - filter by product
    if (productFilter) {
      filtered = filtered.filter(item => item.productId?._id === productFilter);
    }

    // Date range filter
    if (dateRange && dateRange.length === 2) {
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
      message.error('An error occurred while approving feedback');
    }
  };

  const handleUnapprovalFeedback = async (id) => {
    try {
      await unapprovalFeedback(id);
      message.success('Feedback has been unapproved');
      fetchFeedbacks();
    } catch (err) {
      console.error('Error unapproving feedback:', err);
      message.error('An error occurred while unapproving feedback');
    }
  };

  const handleDeleteFeedback = async (id) => {
    try {
      await deleteFeedback(id);
      message.success('Feedback has been deleted successfully');
      fetchFeedbacks();
    } catch (err) {
      console.error('Error deleting feedback:', err);
      message.error('An error occurred while deleting feedback');
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
    <div className="feedback-manage-container">
      <FeedbackProductStats stats={stats} />
      <Card>
        <FeedbackProductFilters
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          ratingFilter={ratingFilter}
          setRatingFilter={setRatingFilter}
          productFilter={productFilter}
          setProductFilter={setProductFilter}
          products={products}
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