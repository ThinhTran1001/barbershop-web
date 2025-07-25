import React, { useState, useEffect } from 'react';
import { message, Row, Col, Button, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import BlogCard from './BlogCard';
import { getAllBlogs } from '../../../services/api';

const POSTS_PER_PAGE = 6; 

const BlogList = ({ sort, category, tags = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setPosts([]);
    setTotal(0);
    fetchBlogs(1, true);
    // eslint-disable-next-line
  }, [sort, category, JSON.stringify(tags)]);

  const fetchBlogs = async (page, reset = false) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = {
        page,
        limit: POSTS_PER_PAGE,
        sort,
        category,
      };
      // KHÔNG truyền tags vào params
      const res = await getAllBlogs(params);
      let blogs = res.data?.data || [];
      // Lọc tags ở frontend nếu có chọn tags
      if (tags && tags.length > 0) {
        blogs = blogs.filter(blog =>
          Array.isArray(blog.tags) && blog.tags.some(tag => tags.includes(tag))
        );
      }
      // Lọc category ở frontend nếu có chọn category (nếu backend chưa hỗ trợ)
      if (category) {
        blogs = blogs.filter(blog =>
          Array.isArray(blog.categories) && blog.categories.includes(category)
        );
      }
      if (reset) {
        setPosts(blogs);
      } else {
        setPosts((prev) => [...prev, ...blogs]);
      }
      setTotal(res.data?.total || blogs.length);
    } catch {
      message.error('Lỗi tải blog');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchBlogs(nextPage);
  };

  // Chia bài viết thành 2 cột
  const col1 = posts.filter((_, idx) => idx % 2 === 0);
  const col2 = posts.filter((_, idx) => idx % 2 === 1);

  return (
    <>
      <Row gutter={[40, 40]} style={{ alignItems: 'stretch' }}>
        <Col xs={24} md={12}>
          {col1.map((post) => (
            <div
              key={post._id}
              onClick={() => navigate(`/news/${post._id}`)}
              style={{ marginBottom: 40 }}
            >
              <BlogCard
                image={post.image}
                title={post.title}
                shortDesc={post.shortDesc}
                date={post.date ? new Date(post.date).toLocaleDateString('vi-VN') : ''}
                category={post.categories || post.category}
                author={post.author}
              />
            </div>
          ))}
        </Col>
        <Col xs={24} md={12}>
          {col2.map((post) => (
            <div
              key={post._id}
              onClick={() => navigate(`/news/${post._id}`)}
              style={{ marginBottom: 40 }}
            >
              <BlogCard
                image={post.image}
                title={post.title}
                shortDesc={post.shortDesc}
                date={post.date ? new Date(post.date).toLocaleDateString('vi-VN') : ''}
                category={post.categories || post.category}
                author={post.author}
              />
            </div>
          ))}
        </Col>
      </Row>
      {posts.length < total && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Button
            type="primary"
            style={{ background: '#b08d57', border: 'none', minWidth: 120, fontWeight: 600, margin: 10 }}
            loading={loadingMore}
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? <Spin size="small" /> : 'LOAD MORE'}
          </Button>
        </div>
      )}
      {loading && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Spin size="large" />
        </div>
      )}
    </>
  );
};

export default BlogList;
