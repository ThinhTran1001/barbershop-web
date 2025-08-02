import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Slider,
  Button,
  Tag,
  Space,
  Spin,
  message,
  Empty,
  Badge
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  StarOutlined,
  ClockCircleOutlined,
  DollarOutlined
} from '@ant-design/icons';
import {
  fetchAllServices,
  fetchServiceCategories,
  fetchHairTypes,
  fetchStyleCompatibility,
  fetchServiceSuggestions
} from '../services/serviceApi.js';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const ServiceSelectionStep = ({ onServiceSelect, selectedService }) => {
  const { user } = useAuth();
  
  // State management
  const [allServices, setAllServices] = useState([]);
  const [displayedServices, setDisplayedServices] = useState([]);
  const [suggestedServices, setSuggestedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    category: '',
    hairType: '',
    styleCompatibility: '',
    minPrice: 0,
    maxPrice: 1000000,
    searchQuery: ''
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    hairTypes: [],
    styleCompatibility: []
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [servicesData, categoriesData, hairTypesData, styleCompatibilityData] = await Promise.all([
          fetchAllServices(),
          fetchServiceCategories(),
          fetchHairTypes(),
          fetchStyleCompatibility()
        ]);

        const services = Array.isArray(servicesData.services) ? servicesData.services : Array.isArray(servicesData) ? servicesData : [];
        setAllServices(services);
        setDisplayedServices(services);
        
        setFilterOptions({
          categories: categoriesData || [],
          hairTypes: hairTypesData || [],
          styleCompatibility: styleCompatibilityData || []
        });

        // Load suggestions if user is logged in
        if (user) {
          loadSuggestions();
        }
      } catch (error) {
        message.error('Failed to load services');
        console.error('Error loading services:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  // Load personalized suggestions
  const loadSuggestions = async () => {
    if (!user) return;
    
    setLoadingSuggestions(true);
    try {
      const data = await fetchServiceSuggestions({
        userId: user.id,
        limit: 6
      });
      setSuggestedServices(Array.isArray(data?.suggestions) ? data.suggestions : []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [filters, allServices]);

  const applyFilters = () => {
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
        service.description?.toLowerCase().includes(query)
      );
    }

    setDisplayedServices(filtered);
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
  };

  // Handle service selection
  const handleServiceSelect = (service) => {
    onServiceSelect(service);
  };

  // Render service card
  const renderServiceCard = (service, isSelected = false, isSuggested = false) => (
    <Card
      key={service._id}
      hoverable
      className={`service-card ${isSelected ? 'selected' : ''}`}
      onClick={() => handleServiceSelect(service)}
      style={{
        marginBottom: '16px',
        border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
        backgroundColor: isSelected ? '#f0f8ff' : 'white',
        position: 'relative'
      }}
      bodyStyle={{ padding: '16px' }}
    >
      {isSuggested && (
        <Badge.Ribbon text="Recommended" color="gold" />
      )}
      
      <Row align="middle" justify="space-between">
        <Col span={16}>
          <Title level={5} style={{ margin: 0, marginBottom: '4px' }}>
            {service.name}
          </Title>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
            {service.description}
          </Text>
          
          <Space size="small" wrap>
            <Tag icon={<ClockCircleOutlined />} color="blue">
              {service.durationMinutes || 30} min
            </Tag>
            <Tag icon={<DollarOutlined />} color="green">
              {service.price?.toLocaleString()} VND
            </Tag>
            {service.category && (
              <Tag color="purple">{service.category}</Tag>
            )}
          </Space>
        </Col>
        
        <Col span={8} style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
            {service.price?.toLocaleString()} VND
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {service.durationMinutes || 30} minutes
          </div>
        </Col>
      </Row>
    </Card>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading services...</div>
      </div>
    );
  }

  return (
    <div className="service-selection-step">
      {/* Suggested Services */}
      {user && suggestedServices.length > 0 && (
        <Card 
          title={
            <Space>
              <StarOutlined style={{ color: '#faad14' }} />
              Recommended for You
            </Space>
          }
          style={{ marginBottom: '24px' }}
          loading={loadingSuggestions}
        >
          <Row gutter={[16, 16]}>
            {suggestedServices.slice(0, 3).map(service => (
              <Col xs={24} sm={12} md={8} key={service._id}>
                {renderServiceCard(service, selectedService?._id === service._id, true)}
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Filters */}
      <Card 
        title={
          <Space>
            <FilterOutlined />
            Filter Services
          </Space>
        }
        style={{ marginBottom: '24px' }}
        extra={
          <Button 
            icon={<ClearOutlined />} 
            onClick={clearFilters}
            size="small"
          >
            Clear
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="Search services..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Category"
              value={filters.category}
              onChange={(value) => handleFilterChange('category', value)}
              style={{ width: '100%' }}
              allowClear
            >
              {filterOptions.categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Hair Type"
              value={filters.hairType}
              onChange={(value) => handleFilterChange('hairType', value)}
              style={{ width: '100%' }}
              allowClear
            >
              {filterOptions.hairTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text strong>Price Range: {filters.minPrice.toLocaleString()} - {filters.maxPrice.toLocaleString()} VND</Text>
              <Slider
                range
                min={0}
                max={1000000}
                step={50000}
                value={[filters.minPrice, filters.maxPrice]}
                onChange={(value) => {
                  handleFilterChange('minPrice', value[0]);
                  handleFilterChange('maxPrice', value[1]);
                }}
                style={{ marginTop: '8px' }}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* Services List */}
      <Card title={`All Services (${displayedServices.length})`}>
        {displayedServices.length === 0 ? (
          <Empty 
            description="No services found matching your criteria"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {displayedServices.map(service => (
              <Col xs={24} sm={12} lg={8} key={service._id}>
                {renderServiceCard(service, selectedService?._id === service._id)}
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
};

export default ServiceSelectionStep;
