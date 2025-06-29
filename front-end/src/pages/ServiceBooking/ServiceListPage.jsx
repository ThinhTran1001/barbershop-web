import React, { useState, useEffect } from 'react';
import ServiceItem from '../../components/ServiceItem.jsx';
import { fetchAllServices } from '../../services/serviceApi.js';
import { Card, Button, Input, Row, Col, Typography, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const ServiceListPage = () => {
  const navigate = useNavigate();
  const [hairType, setHairType] = useState('');
  const [suggestedServices, setSuggestedServices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allServices, setAllServices] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    setFetching(true);
    fetchAllServices().then(data => {
      setAllServices(data);
      setFetching(false);
    }).catch(() => {
      message.error('Failed to fetch services');
      setFetching(false);
    });
  }, []);

  const handleSuggest = async () => {
    setLoading(true);
    const { fetchServiceSuggestions } = await import('../../services/serviceApi.js');
    try {
      const data = await fetchServiceSuggestions({ hairType });
      setSuggestedServices(data);
    } catch (e) {
      setSuggestedServices([]);
      message.error('Failed to fetch suggestions');
    }
    setLoading(false);
  };

  const handleBook = (service) => {
    localStorage.setItem('selectedService', JSON.stringify(service));
    localStorage.removeItem('selectedBarber');
    // Không cần xóa timeSlot vì không còn bước chọn giờ
    navigate('/choose-barber');
  };

  const renderServices = (services) => (
    <Row gutter={[24, 24]}>
      {services.map((service, idx) => (
        <Col xs={24} sm={12} md={8} lg={6} key={service._id || idx}>
          <Card
            title={service.name}
            extra={<span style={{ color: '#1890ff', fontWeight: 500 }}>{service.price?.toLocaleString()} đ</span>}
            bordered={false}
            style={{ minHeight: 180 }}
          >
            <div style={{ minHeight: 60 }}>{service.description}</div>
            <Button
              type="primary"
              block
              style={{ marginTop: 16 }}
              onClick={() => handleBook(service)}
            >
              Đặt lịch
            </Button>
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>Dịch vụ & Bảng giá</Title>
      <Input.Search
        placeholder="Nhập loại tóc để gợi ý (tuỳ chọn)"
        enterButton="Gợi ý dịch vụ"
        value={hairType}
        onChange={e => setHairType(e.target.value)}
        onSearch={handleSuggest}
        loading={loading}
        style={{ maxWidth: 400, marginBottom: 32 }}
      />
      {loading || fetching ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}><Spin size="large" /></div>
      ) : suggestedServices ? (
        <div>
          <Title level={4}>Dịch vụ gợi ý</Title>
          {renderServices(suggestedServices)}
          <Button onClick={() => setSuggestedServices(null)} style={{ marginTop: 24 }}>Xem tất cả dịch vụ</Button>
        </div>
      ) : (
        renderServices(allServices)
      )}
    </div>
  );
};

export default ServiceListPage;
