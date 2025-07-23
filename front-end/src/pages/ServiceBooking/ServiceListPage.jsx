import React, { useState, useEffect } from 'react';
import ServiceItem from '../../components/ServiceItem.jsx';
import {
  fetchAllServices,
  fetchServiceSuggestions,
  fetchServiceCategories,
  fetchHairTypes,
  fetchStyleCompatibility,
  searchServices
} from '../../services/serviceApi.js';
import {
  Card,
  Button,
  Input,
  Row,
  Col,
  Typography,
  Spin,
  message,
  Select,
  Slider,
  Space,
  Tag,
  Divider,
  Tabs
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const ServiceListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for services and loading
  const [allServices, setAllServices] = useState([]);
  const [displayedServices, setDisplayedServices] = useState([]);
  const [suggestedServices, setSuggestedServices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // State for filters
  const [filters, setFilters] = useState({
    category: '',
    hairType: '',
    styleCompatibility: '',
    minPrice: 0,
    maxPrice: 1000000,
    searchQuery: ''
  });

  // State for filter options
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    hairTypes: [],
    styleCompatibility: []
  });

  // State for customer preferences
  const [customerPreferences, setCustomerPreferences] = useState({
    hairType: '',
    stylePreference: ''
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setFetching(true);
      try {
        // Load services and filter options in parallel
        const [servicesData, categoriesData, hairTypesData, styleCompatibilityData] = await Promise.all([
          fetchAllServices(),
          fetchServiceCategories(),
          fetchHairTypes(),
          fetchStyleCompatibility()
        ]);

        // setAllServices(servicesData.services || servicesData);
        // setDisplayedServices(servicesData.services || servicesData);
        setAllServices(Array.isArray(servicesData.services) ? servicesData.services : Array.isArray(servicesData) ? servicesData : []);
        setDisplayedServices(Array.isArray(servicesData.services) ? servicesData.services : Array.isArray(servicesData) ? servicesData : []);
        setFilterOptions({
          categories: categoriesData,
          hairTypes: hairTypesData,
          styleCompatibility: styleCompatibilityData
        });
      } catch (error) {
        message.error('Failed to fetch services');
        console.error('Error loading initial data:', error);
      } finally {
        setFetching(false);
      }
    };

    loadInitialData();
  }, []);

  // Apply filters when filters change
  useEffect(() => {
    applyFilters();
  }, [filters, allServices]);

  // Apply filters to services
  const applyFilters = async () => {
    if (!allServices.length) return;

    let filtered = [...allServices];

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(service => service.category === filters.category);
    }

    // Apply hair type filter
    if (filters.hairType) {
      filtered = filtered.filter(service =>
        service.hairTypes && service.hairTypes.includes(filters.hairType)
      );
    }

    // Apply style compatibility filter
    if (filters.styleCompatibility) {
      filtered = filtered.filter(service =>
        service.styleCompatibility && service.styleCompatibility.includes(filters.styleCompatibility)
      );
    }

    // Apply price range filter
    filtered = filtered.filter(service =>
      service.price >= filters.minPrice && service.price <= filters.maxPrice
    );

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.steps?.some(step => step.toLowerCase().includes(query))
      );
    }

    setDisplayedServices(filtered);
  };

  // Get personalized suggestions
  const handleGetSuggestions = async () => {
    setLoading(true);
    try {
      const data = await fetchServiceSuggestions({
        hairType: customerPreferences.hairType,
        stylePreference: customerPreferences.stylePreference,
        userId: user?.id,
        limit: 10
      });
      // setSuggestedServices(data.suggestions || data);
      setSuggestedServices(Array.isArray(data?.suggestions) ? data.suggestions : []);
    } catch (error) {
      message.error('Failed to fetch suggestions');
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      hairType: '',
      styleCompatibility: '',
      minPrice: 0,
      maxPrice: 1000000,
      searchQuery: ''
    });
    setSuggestedServices(null);
  };

  const handleBook = (service) => {
    localStorage.setItem('selectedService', JSON.stringify(service));
    localStorage.removeItem('selectedBarber');
    localStorage.removeItem('selectedTimeSlot');
    navigate('/choose-barber');
  };

  const renderServices = (services) => {
    if (!Array.isArray(services) || services.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Title level={4} style={{ color: '#999' }}>Không tìm thấy dịch vụ phù hợp</Title>
          <Button onClick={clearFilters}>Xóa bộ lọc</Button>
        </div>
      );
    }

    return (
      <Row gutter={[24, 24]}>
        {services.map((service, idx) => (
          <Col xs={24} sm={12} md={8} lg={6} key={service._id || idx}>
            <Card
              title={service.name}
              extra={<span style={{ color: '#1890ff', fontWeight: 500 }}>{service.price?.toLocaleString()} đ</span>}
              bordered={false}
              style={{ minHeight: 220 }}
              actions={[
                <Button
                  type="primary"
                  block
                  onClick={() => handleBook(service)}
                >
                  Đặt lịch
                </Button>
              ]}
            >
              <div style={{ minHeight: 80, marginBottom: 16 }}>
                {service.description}
              </div>

              {/* Service tags */}
              <div style={{ marginBottom: 12 }}>
                {service.category && (
                  <Tag color="blue">{service.category}</Tag>
                )}
                {service.durationMinutes && (
                  <Tag color="green">{service.durationMinutes} phút</Tag>
                )}
              </div>

              {/* Hair types and style compatibility */}
              {(service.hairTypes?.length > 0 || service.styleCompatibility?.length > 0) && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {service.hairTypes?.length > 0 && (
                    <div>Phù hợp: {service.hairTypes.join(', ')}</div>
                  )}
                  {service.styleCompatibility?.length > 0 && (
                    <div>Kiểu: {service.styleCompatibility.join(', ')}</div>
                  )}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className="container" style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>Dịch vụ & Bảng giá</Title>

      <Tabs defaultActiveKey="browse" style={{ marginBottom: 24 }}>
        <TabPane tab="Duyệt dịch vụ" key="browse">
          {/* Filters Section */}
          <Card style={{ marginBottom: 24 }}>
            <Title level={4} style={{ marginBottom: 16 }}>Bộ lọc</Title>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <label>Tìm kiếm:</label>
                <Input
                  placeholder="Tên dịch vụ..."
                  value={filters.searchQuery}
                  onChange={e => handleFilterChange('searchQuery', e.target.value)}
                  allowClear
                />
              </Col>

              <Col xs={24} sm={12} md={6}>
                <label>Danh mục:</label>
                <Select
                  placeholder="Chọn danh mục"
                  value={filters.category}
                  onChange={value => handleFilterChange('category', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {filterOptions.categories.map(category => (
                    <Option key={category} value={category}>{category}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <label>Loại tóc:</label>
                <Select
                  placeholder="Chọn loại tóc"
                  value={filters.hairType}
                  onChange={value => handleFilterChange('hairType', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {filterOptions.hairTypes.map(hairType => (
                    <Option key={hairType} value={hairType}>{hairType}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <label>Kiểu dáng:</label>
                <Select
                  placeholder="Chọn kiểu dáng"
                  value={filters.styleCompatibility}
                  onChange={value => handleFilterChange('styleCompatibility', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {filterOptions.styleCompatibility.map(style => (
                    <Option key={style} value={style}>{style}</Option>
                  ))}
                </Select>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} md={12}>
                <label>Khoảng giá: {filters.minPrice.toLocaleString()} - {filters.maxPrice.toLocaleString()} đ</label>
                <Slider
                  range
                  min={0}
                  max={1000000}
                  step={50000}
                  value={[filters.minPrice, filters.maxPrice]}
                  onChange={([min, max]) => {
                    handleFilterChange('minPrice', min);
                    handleFilterChange('maxPrice', max);
                  }}
                />
              </Col>

              <Col xs={24} md={12} style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
                <Button onClick={clearFilters}>Xóa bộ lọc</Button>
                <Button type="primary" onClick={applyFilters}>Áp dụng</Button>
              </Col>
            </Row>
          </Card>

          {/* Services Display */}
          {fetching ? (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>
                  {suggestedServices ? 'Dịch vụ gợi ý' : 'Tất cả dịch vụ'}
                  ({(suggestedServices || displayedServices).length})
                </Title>
                {suggestedServices && (
                  <Button onClick={() => setSuggestedServices(null)}>
                    Xem tất cả dịch vụ
                  </Button>
                )}
              </div>
              {renderServices(suggestedServices || displayedServices)}
            </>
          )}
        </TabPane>

        <TabPane tab="Gợi ý cá nhân" key="suggestions">
          <Card>
            <Title level={4} style={{ marginBottom: 16 }}>Nhận gợi ý dịch vụ phù hợp</Title>
            <p>Để nhận được gợi ý tốt nhất, vui lòng cung cấp thông tin về tóc và sở thích của bạn:</p>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} md={12}>
                <label>Loại tóc của bạn:</label>
                <Select
                  placeholder="Chọn loại tóc"
                  value={customerPreferences.hairType}
                  onChange={value => setCustomerPreferences(prev => ({ ...prev, hairType: value }))}
                  style={{ width: '100%' }}
                >
                  {filterOptions.hairTypes.map(hairType => (
                    <Option key={hairType} value={hairType}>{hairType}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} md={12}>
                <label>Kiểu dáng ưa thích:</label>
                <Select
                  placeholder="Chọn kiểu dáng"
                  value={customerPreferences.stylePreference}
                  onChange={value => setCustomerPreferences(prev => ({ ...prev, stylePreference: value }))}
                  style={{ width: '100%' }}
                >
                  {filterOptions.styleCompatibility.map(style => (
                    <Option key={style} value={style}>{style}</Option>
                  ))}
                </Select>
              </Col>
            </Row>

            <Button
              type="primary"
              onClick={handleGetSuggestions}
              loading={loading}
              disabled={!customerPreferences.hairType && !customerPreferences.stylePreference}
            >
              Nhận gợi ý dịch vụ
            </Button>

            {suggestedServices && (
              <div style={{ marginTop: 24 }}>
                <Divider />
                <Title level={4}>Dịch vụ được gợi ý cho bạn</Title>
                {renderServices(suggestedServices)}
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ServiceListPage;
