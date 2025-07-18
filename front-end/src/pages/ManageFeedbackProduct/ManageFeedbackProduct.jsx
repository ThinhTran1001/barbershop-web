import React, { useState, useEffect } from 'react';
import { Card, message } from 'antd';
import FeedbackProductStats from '../../components/FeedbackProductStats';
import FeedbackProductFilters from '../../components/FeedbackProductFilters';
import FeedbackProductTable from '../../components/FeedbackProductTable';
import FeedbackProductModal from '../../components/FeedbackProductModal';
import { getAllFeedbacks, deleteFeedback } from '../../services/api';
import dayjs from 'dayjs';
import './ManageFeedbackProduct.css';

const ManageFeedbackProduct = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState([]);
  const [ratingFilter, setRatingFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
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
      const feedbackData = res.data?.data || res.data || res || [];
      setFeedbacks(Array.isArray(feedbackData) ? feedbackData : []);

      if (Array.isArray(feedbackData) && feedbackData.length > 0) {
        const uniqueProducts = [];
        const productIds = new Set();
        
        // Tính toán rating trung bình cho từng sản phẩm
        const productRatings = {};
        
        feedbackData.forEach(feedback => {
          if (feedback.productId && feedback.productId._id && !feedback.isDeleted) {
            const productId = feedback.productId._id;
            if (!productRatings[productId]) {
              productRatings[productId] = {
                totalRating: 0,
                count: 0,
                name: feedback.productId.name || 'Unknown Product'
              };
            }
            productRatings[productId].totalRating += feedback.rating || 0;
            productRatings[productId].count += 1;
          }
        });
        
        // Tạo danh sách sản phẩm với rating đã tính
        Object.keys(productRatings).forEach(productId => {
          const product = productRatings[productId];
          uniqueProducts.push({
            _id: productId,
            name: product.name,
            rating: product.count > 0 ? (product.totalRating / product.count) : 0,
            reviews: product.count
          });
        });
        
        setProducts(uniqueProducts);
      } else {
        setProducts([]);
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

    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(item =>
        (item.comment?.toLowerCase().includes(searchLower) || '') ||
        (item.userId?.name?.toLowerCase().includes(searchLower) || '') ||
        (item.productId?.name?.toLowerCase().includes(searchLower) || '')
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(item =>
        statusFilter === 'Active' ? !item.isDeleted : item.isDeleted
      );
    }

    if (ratingFilter !== 'All') {
      filtered = filtered.filter(item => item.rating === Number(ratingFilter));
    }

    if (productFilter !== 'All') {
      filtered = filtered.filter(item => item.productId?._id === productFilter);
    }

    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      filtered = filtered.filter(item => {
        const created = dayjs(item.createdAt);
        return created.isAfter(start.startOf('day')) && created.isBefore(end.endOf('day'));
      });
    }

    setFilteredFeedbacks(filtered);
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
    active: feedbacks.filter(f => !f.isDeleted).length,
    deleted: feedbacks.filter(f => f.isDeleted).length
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