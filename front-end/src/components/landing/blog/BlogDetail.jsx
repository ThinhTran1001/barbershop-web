import React, { useEffect, useState, useMemo } from 'react';
import {
  Layout,
  Row,
  Col,
  Typography,
  Space,
  Image,
  Spin,
  message,
  Breadcrumb,
  Card,
  Avatar
} from 'antd';
import {
  EyeOutlined,
  UserOutlined
} from '@ant-design/icons';
import { getBlogById } from '../../../services/api';
import { useParams, Link } from 'react-router-dom';
import RelatedPosts from './RelatedPosts';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const generateTOC = (content) => {
    if (!content) return [];
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
    const headings = [];
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      headings.push({
        level: parseInt(match[1]),
        text: match[2].replace(/<[^>]*>/g, ''),
        id: match[2].replace(/<[^>]*>/g, '').toLowerCase().replace(/\s+/g, '-')
      });
    }
    return headings;
  };

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await getBlogById(id);
        if (res.data?.success) {
          setBlog(res.data.data);
        } else {
          message.error(`Không thể tải bài viết: ${res.data?.message || 'Lỗi không xác định'}`);
        }
      } catch (error) {
        console.error('Error fetching blog:', error);
        message.error(`Không thể tải bài viết: ${error.message || 'Lỗi kết nối'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  const toc = useMemo(() => generateTOC(blog?.content || ''), [blog?.content]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' }}>
        Không tìm thấy bài viết
      </div>
    );
  }

  return (
    <Layout style={{ backgroundColor: '#f5f5f5' }}>
      <Content style={{ padding: '0 50px', marginTop: '20px' }}>
        <Breadcrumb
          style={{ margin: '90px 0px 50px 30px', fontSize: '14px' }}
        >
          <Breadcrumb.Item>
            <Link to="/">
              <Space style={{ color: 'blue' }}>
                <span>Trang chủ</span>
              </Space>
            </Link>
          </Breadcrumb.Item>

          <Breadcrumb.Item>
            <Link to="/news">
              <Space>
                <span>Blogs</span>
              </Space>
            </Link>
          </Breadcrumb.Item>

          <Breadcrumb.Item>{blog.title}</Breadcrumb.Item>
        </Breadcrumb>

        <Row gutter={[32, 32]} style={{ marginBottom: '40px' }}>
          <Col xs={24} lg={24}>
            <Card
              style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: 'none'
              }}
            >
              <div style={{ marginBottom: '24px' }}>
                <Title level={1} style={{ fontSize: '28px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' }}>
                  {blog.title}
                </Title>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  color: '#666'
                }}>
                  <Space>
                    <Text type="secondary">Ngày tạo:</Text>
                    <Text strong>{formatDate(blog.date)}</Text>
                  </Space>
                  <Space>
                    <Text type="secondary">Danh mục:</Text>
                    <Text strong>{blog.category}</Text>
                  </Space>
                  <Space>
                    <Text type="secondary">Ngày cập nhật:</Text>
                    <Text strong>{formatDate(blog.updatedAt)}</Text>
                  </Space>
                  <Space>
                    <EyeOutlined />
                    <Text type="secondary">{blog.views} lượt xem</Text>
                  </Space>
                </div>

                {toc.length > 0 && (
                  <Card
                    size="small"
                    style={{
                      backgroundColor: '#f8f9fa',
                      border: '1px dashed #d9d9d9',
                      borderRadius: '8px',
                      marginBottom: '24px'
                    }}
                  >
                    <Title level={4} style={{ margin: 0, textAlign: 'center' }}>Nội dung chính</Title>
                    <div style={{ marginTop: '12px' }}>
                      {toc.map((item, index) => (
                        <div key={index} style={{ marginBottom: '8px', marginLeft: `${(item.level - 1) * 20}px` }}>
                          <Text strong={item.level <= 2}>{index + 1}. {item.text}</Text>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {blog.image && (
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    loading="lazy"
                    style={{ width: '100%', borderRadius: '8px', maxHeight: '400px', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#333' }}>
                {blog.shortDesc && (
                  <Paragraph
                    style={{
                      fontSize: '18px',
                      fontWeight: '500',
                      color: '#444',
                      marginBottom: '24px',
                      fontStyle: 'italic',
                      background: '#f8f9fa',
                      padding: '16px',
                      borderRadius: '8px',
                      borderLeft: '4px solid #1890ff'
                    }}
                  >
                    {blog.shortDesc}
                  </Paragraph>
                )}

                {blog.content && (
                  <div
                    style={{ fontSize: '16px', lineHeight: '1.8', color: '#333' }}
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                  />
                )}
              </div>
            </Card>
          </Col>
        </Row>
        <div style={{ borderTop: '1px solid #eee', paddingTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar size={56} icon={<UserOutlined />} />
          <div>
            <Text strong>About admin</Text>
            <Paragraph style={{ margin: 0, color: '#888', fontSize: 15 }}>
              Admin là người chia sẻ các kiến thức, kinh nghiệm về barber, chăm sóc tóc và làm đẹp nam giới.
            </Paragraph>
          </div>
        </div>
        <RelatedPosts currentBlog={blog} />
      </Content>
    </Layout>
  );
};

export default BlogDetail;
