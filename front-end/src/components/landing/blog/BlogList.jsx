import React, { useState, useEffect } from 'react';
import { Pagination, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import BlogCard from './BlogCard';
import { getAllBlogs } from '../../../services/api';

const POSTS_PER_PAGE = 5;

const BlogList = ({ sort, category }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await getAllBlogs({
          page: currentPage,
          limit: POSTS_PER_PAGE,
          sort,
          category,
        });

        setPosts(res.data?.data || []);
        setTotal(res.data?.total || 0);
      } catch {
        message.error('Lỗi tải blog');
      }
    };

    fetchBlogs();
  }, [sort, category, currentPage]);

  return (
    <>
      {posts.map((post) => (
        <div
          key={post._id}
          onClick={() => navigate(`/news/${post._id}`)}
          style={{ cursor: 'pointer' }}
        >
          <BlogCard {...post} />
        </div>
      ))}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Pagination
          current={currentPage}
          pageSize={POSTS_PER_PAGE}
          total={total}
          onChange={setCurrentPage}
        />
      </div>
    </>
  );
};

export default BlogList;
