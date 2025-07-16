import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Row, Col } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { getAllBlogs } from '../../../services/api';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const RelatedPosts = ({ currentBlog }) => {
  const [related, setRelated] = useState([]);
  const [startIdx, setStartIdx] = useState(0);
  const navigate = useNavigate();
  const SHOW_COUNT = 3;

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        // Lấy cùng chuyên mục trước
        let res = await getAllBlogs({
          category: currentBlog.categories?.[0] || currentBlog.category,
          limit: 8,
        });
        let filtered = (res.data?.data || []).filter(b => b._id !== currentBlog._id);
        // Nếu không có bài cùng chuyên mục, lấy random các bài khác
        if (filtered.length === 0) {
          res = await getAllBlogs({ limit: 8 });
          filtered = (res.data?.data || []).filter(b => b._id !== currentBlog._id);
        }
        setRelated(filtered);
      } catch {
        setRelated([]);
      }
    };
    if (currentBlog) fetchRelated();
  }, [currentBlog]);

  const handlePrev = () => {
    setStartIdx(idx => Math.max(0, idx - SHOW_COUNT));
  };
  const handleNext = () => {
    setStartIdx(idx => Math.min(related.length - SHOW_COUNT, idx + SHOW_COUNT));
  };

  if (!related.length) return null;

  return (
    <div style={{ marginTop: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Related Posts</Title>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button
            icon={<LeftOutlined />}
            onClick={handlePrev}
            disabled={startIdx === 0}
            style={{ background: '#b08d57', color: '#fff', border: 'none', borderRadius: 0 }}
          />
          <Button
            icon={<RightOutlined />}
            onClick={handleNext}
            disabled={startIdx + SHOW_COUNT >= related.length}
            style={{ background: '#b08d57', color: '#fff', border: 'none', borderRadius: 0 }}
          />
        </div>
      </div>
      <Row gutter={32}>
        {related.slice(startIdx, startIdx + SHOW_COUNT).map(post => (
          <Col key={post._id} xs={24} md={8} lg={8}>
            <Card
              hoverable
              cover={
                <img
                  src={post.image}
                  alt={post.title}
                  style={{ height: 180, objectFit: 'cover', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
                  onClick={() => navigate(`/news/${post._id}`)}
                />
              }
              style={{ borderRadius: 8, marginBottom: 16, cursor: 'pointer', minHeight: 260 }}
              onClick={() => navigate(`/news/${post._id}`)}
            >
              <Text style={{ color: '#b08d57', fontWeight: 600, fontSize: 16 }}>{post.title}</Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default RelatedPosts; 