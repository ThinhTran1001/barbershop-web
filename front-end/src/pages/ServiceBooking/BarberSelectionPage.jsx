import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllBarbers,
  autoAssignBarber,
  getBarberAvailability
} from '../../services/barberApi.js';
import {
  Card,
  Typography,
  Button,
  Row,
  Col,
  Select,
  Input,
  Spin,
  message,
  Tag,
  Rate,
  Avatar,
  Divider,
  Modal,
  Space,
  Alert
} from 'antd';
import { UserOutlined, StarOutlined, ClockCircleOutlined, InfoCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const BarberSelectionPage = () => {
  const navigate = useNavigate();

  // State management
  const [barbers, setBarbers] = useState([]);
  const [filteredBarbers, setFilteredBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    expertiseTags: [],
    hairTypeExpertise: '',
    styleExpertise: '',
    minRating: 0,
    minExperience: 0,
    searchQuery: ''
  });

  // Auto-assignment modal
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [autoAssignResult, setAutoAssignResult] = useState(null);

  // Get selected service from localStorage
  const selectedService = JSON.parse(localStorage.getItem('selectedService') || '{}');

  // Load barbers on component mount
  useEffect(() => {
    loadBarbers();
  }, []);

  // Apply filters when filters change
  useEffect(() => {
    applyFilters();
  }, [filters, barbers]);

  const loadBarbers = async () => {
    setLoading(true);
    try {
      const response = await fetchAllBarbers({
        isAvailable: true,
        sortBy: 'averageRating',
        sortOrder: 'desc'
      });

      const barbersData = response.barbers || response;
      setBarbers(barbersData);
      setFilteredBarbers(barbersData);
    } catch (error) {
      message.error('Failed to load barbers');
      console.error('Error loading barbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!barbers.length) return;

    let filtered = [...barbers];

    // Apply expertise tags filter
    if (filters.expertiseTags.length > 0) {
      filtered = filtered.filter(barber =>
        barber.expertiseTags &&
        filters.expertiseTags.some(tag => barber.expertiseTags.includes(tag))
      );
    }

    // Apply hair type expertise filter
    if (filters.hairTypeExpertise) {
      filtered = filtered.filter(barber =>
        barber.hairTypeExpertise &&
        barber.hairTypeExpertise.includes(filters.hairTypeExpertise)
      );
    }

    // Apply style expertise filter
    if (filters.styleExpertise) {
      filtered = filtered.filter(barber =>
        barber.styleExpertise &&
        barber.styleExpertise.includes(filters.styleExpertise)
      );
    }

    // Apply minimum rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(barber =>
        (barber.averageRating || 0) >= filters.minRating
      );
    }

    // Apply minimum experience filter
    if (filters.minExperience > 0) {
      filtered = filtered.filter(barber =>
        (barber.experienceYears || 0) >= filters.minExperience
      );
    }

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(barber =>
        barber.userId?.name?.toLowerCase().includes(query) ||
        barber.specialties?.some(specialty =>
          specialty.toLowerCase().includes(query)
        ) ||
        barber.expertiseTags?.some(tag =>
          tag.toLowerCase().includes(query)
        )
      );
    }

    setFilteredBarbers(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      expertiseTags: [],
      hairTypeExpertise: '',
      styleExpertise: '',
      minRating: 0,
      minExperience: 0,
      searchQuery: ''
    });
  };

  const handleSelect = (barber) => {
    setSelectedBarber(barber);
    localStorage.setItem('selectedBarber', JSON.stringify(barber));
    navigate('/choose-time-slot');
  };

  const handleAutoAssign = async () => {
    if (!selectedService._id) {
      message.error('Please select a service first');
      return;
    }

    setAutoAssigning(true);
    try {
      // For demo, use tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await autoAssignBarber(
        selectedService._id,
        tomorrow.toISOString(),
        {
          hairType: filters.hairTypeExpertise,
          stylePreference: filters.styleExpertise
        }
      );

      setAutoAssignResult(result);
      setShowAutoAssignModal(true);
    } catch (error) {
      message.error('Failed to auto-assign barber');
      console.error('Auto-assignment error:', error);
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleAcceptAutoAssignment = () => {
    if (autoAssignResult?.assignedBarber) {
      const barberData = {
        _id: autoAssignResult.assignedBarber.id,
        userId: {
          name: autoAssignResult.assignedBarber.name,
          email: autoAssignResult.assignedBarber.email
        },
        averageRating: autoAssignResult.assignedBarber.averageRating,
        experienceYears: autoAssignResult.assignedBarber.experienceYears,
        specialties: autoAssignResult.assignedBarber.specialties,
        expertiseTags: autoAssignResult.assignedBarber.expertiseTags,
        autoAssigned: true
      };

      localStorage.setItem('selectedBarber', JSON.stringify(barberData));
      localStorage.setItem('autoAssignmentInfo', JSON.stringify(autoAssignResult));
      setShowAutoAssignModal(false);
      navigate('/choose-time-slot');
    }
  };

  const handleSkip = () => {
    localStorage.removeItem('selectedBarber');
    localStorage.setItem('skipBarberSelection', 'true');
    navigate('/choose-time-slot');
  };

  const renderBarberCard = (barber) => (
    <Col xs={24} sm={12} md={8} lg={6} key={barber._id}>
      <Card
        hoverable
        style={{ height: '100%' }}
        cover={
          <div style={{ padding: 16, textAlign: 'center' }}>
            <Avatar
              size={80}
              src={barber.profileImageUrl}
              icon={<UserOutlined />}
            />
          </div>
        }
        actions={[
          <Button
            type="primary"
            block
            onClick={() => handleSelect(barber)}
            key="select"
          >
            Chọn thợ này
          </Button>
        ]}
      >
        <Card.Meta
          title={
            <div style={{ textAlign: 'center' }}>
              <div>{barber.userId?.name || 'Unknown'}</div>
              <Rate
                disabled
                defaultValue={barber.averageRating || 0}
                style={{ fontSize: 14 }}
              />
              <div style={{ fontSize: 12, color: '#666' }}>
                ({barber.ratingCount || 0} đánh giá)
              </div>
            </div>
          }
          description={
            <div>
              <div style={{ marginBottom: 8 }}>
                <ClockCircleOutlined /> {barber.experienceYears || 0} năm kinh nghiệm
              </div>

              {barber.specialties && barber.specialties.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Chuyên môn:</strong>
                  <div>
                    {barber.specialties.map(specialty => (
                      <Tag key={specialty} size="small" style={{ margin: '2px' }}>
                        {specialty}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {barber.expertiseTags && barber.expertiseTags.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Kỹ năng:</strong>
                  <div>
                    {barber.expertiseTags.map(tag => (
                      <Tag key={tag} color="blue" size="small" style={{ margin: '2px' }}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {(barber.hairTypeExpertise?.length > 0 || barber.styleExpertise?.length > 0) && (
                <div style={{ fontSize: 12, color: '#666' }}>
                  {barber.hairTypeExpertise?.length > 0 && (
                    <div>Loại tóc: {barber.hairTypeExpertise.join(', ')}</div>
                  )}
                  {barber.styleExpertise?.length > 0 && (
                    <div>Kiểu dáng: {barber.styleExpertise.join(', ')}</div>
                  )}
                </div>
              )}

              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                {barber.totalBookings || 0} lượt đặt lịch
              </div>
            </div>
          }
        />
      </Card>
    </Col>
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
      {/* New Booking Flow Notice */}
      <Alert
        message="🎉 Improved Booking Experience Available!"
        description={
          <Space direction="vertical" size="small">
            <div>We've launched a new single-page booking experience that's faster and easier to use.</div>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/book-service')}
              size="small"
            >
              Try New Booking Experience
            </Button>
          </Space>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
        closable
      />

      <Title level={2} style={{ marginBottom: 24 }}>
        Chọn thợ cắt tóc
        {selectedService.name && (
          <span style={{ fontSize: 16, fontWeight: 'normal', color: '#666' }}>
            {' '}cho dịch vụ: {selectedService.name}
          </span>
        )}
      </Title>

      {/* Filters Section */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 16 }}>Bộ lọc</Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <label>Tìm kiếm:</label>
            <Input
              placeholder="Tên thợ, chuyên môn..."
              value={filters.searchQuery}
              onChange={e => handleFilterChange('searchQuery', e.target.value)}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <label>Kỹ năng chuyên môn:</label>
            <Select
              mode="multiple"
              placeholder="Chọn kỹ năng"
              value={filters.expertiseTags}
              onChange={value => handleFilterChange('expertiseTags', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="fade">Fade</Option>
              <Option value="coloring">Nhuộm màu</Option>
              <Option value="beard">Cắt râu</Option>
              <Option value="long_hair">Tóc dài</Option>
              <Option value="curly_hair">Tóc xoăn</Option>
              <Option value="wedding_styles">Kiểu cưới</Option>
              <Option value="modern_cuts">Kiểu hiện đại</Option>
              <Option value="classic_cuts">Kiểu cổ điển</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <label>Chuyên về loại tóc:</label>
            <Select
              placeholder="Chọn loại tóc"
              value={filters.hairTypeExpertise}
              onChange={value => handleFilterChange('hairTypeExpertise', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="straight">Tóc thẳng</Option>
              <Option value="wavy">Tóc gợn sóng</Option>
              <Option value="curly">Tóc xoăn</Option>
              <Option value="coily">Tóc xoăn tít</Option>
            </Select>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <label>Chuyên về kiểu dáng:</label>
            <Select
              placeholder="Chọn kiểu dáng"
              value={filters.styleExpertise}
              onChange={value => handleFilterChange('styleExpertise', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="short">Tóc ngắn</Option>
              <Option value="medium">Tóc trung bình</Option>
              <Option value="long">Tóc dài</Option>
              <Option value="beard">Râu</Option>
              <Option value="mustache">Ria mép</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <label>Đánh giá tối thiểu:</label>
            <Select
              placeholder="Chọn đánh giá"
              value={filters.minRating || undefined}
              onChange={value => handleFilterChange('minRating', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value={4}>4+ sao</Option>
              <Option value={3}>3+ sao</Option>
              <Option value={2}>2+ sao</Option>
              <Option value={1}>1+ sao</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <label>Kinh nghiệm tối thiểu:</label>
            <Select
              placeholder="Chọn kinh nghiệm"
              value={filters.minExperience || undefined}
              onChange={value => handleFilterChange('minExperience', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value={5}>5+ năm</Option>
              <Option value={3}>3+ năm</Option>
              <Option value={1}>1+ năm</Option>
            </Select>
          </Col>
        </Row>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <Button onClick={clearFilters}>Xóa bộ lọc</Button>
          <Button
            type="primary"
            onClick={handleAutoAssign}
            loading={autoAssigning}
          >
            Tự động chọn thợ phù hợp
          </Button>
          <Button onClick={handleSkip}>
            Bỏ qua (Chọn sau)
          </Button>
        </div>
      </Card>

      {/* Barbers Display */}
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              Danh sách thợ cắt tóc ({filteredBarbers.length})
            </Title>
          </div>

          {filteredBarbers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Title level={4} style={{ color: '#999' }}>Không tìm thấy thợ phù hợp</Title>
              <Button onClick={clearFilters}>Xóa bộ lọc</Button>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {filteredBarbers.map(renderBarberCard)}
            </Row>
          )}
        </>
      )}

      {/* Auto Assignment Modal */}
      <Modal
        title="Kết quả tự động chọn thợ"
        visible={showAutoAssignModal}
        onCancel={() => setShowAutoAssignModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowAutoAssignModal(false)}>
            Chọn lại
          </Button>,
          <Button key="accept" type="primary" onClick={handleAcceptAutoAssignment}>
            Chấp nhận
          </Button>
        ]}
      >
        {autoAssignResult && (
          <div>
            <Title level={4}>Thợ được gợi ý:</Title>
            <div style={{ padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
              <div><strong>Tên:</strong> {autoAssignResult.assignedBarber.name}</div>
              <div><strong>Đánh giá:</strong> {autoAssignResult.assignedBarber.averageRating}/5</div>
              <div><strong>Kinh nghiệm:</strong> {autoAssignResult.assignedBarber.experienceYears} năm</div>
              <div><strong>Chuyên môn:</strong> {autoAssignResult.assignedBarber.specialties?.join(', ')}</div>
              <div><strong>Lý do:</strong> {autoAssignResult.assignmentReason}</div>
            </div>

            {autoAssignResult.alternativeBarbers?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Lựa chọn khác:</Title>
                {autoAssignResult.alternativeBarbers.map((barber, index) => (
                  <div key={index} style={{ padding: 8, border: '1px solid #d9d9d9', borderRadius: 4, marginBottom: 8 }}>
                    <div><strong>{barber.name}</strong> - {barber.averageRating}/5 sao</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BarberSelectionPage;
