import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Select, DatePicker, InputNumber } from 'antd';
import { getAllBarber, createBarber, updateBarber } from '../services/api';
import { InfoCircleFilled, SortAscendingOutlined, SortDescendingOutlined, EyeOutlined } from '@ant-design/icons';
// import moment from 'moment';

const { Option } = Select;

const AVAILABILITY_OPTIONS = [
  { value: true, label: 'Available' },
  { value: false, label: 'Unavailable' },
];
const TOTAL_BOOKINGS_OPTIONS = [
  { value: 0, label: '≥ 0' },
  { value: 5, label: '≥ 5' },
  { value: 10, label: '≥ 10' },
  { value: 20, label: '≥ 20' },
];
const AVERAGE_RATING_OPTIONS = [
  { value: 0, label: '≥ 0' },
  { value: 2, label: '≥ 2' },
  { value: 4, label: '≥ 4' },
  { value: 5, label: '≥ 5' },
];
const EXPERIENCE_OPTIONS = [
  { value: 0, label: '≥ 0 years' },
  { value: 2, label: '≥ 2 years' },
  { value: 5, label: '≥ 5 years' },
  { value: 10, label: '≥ 10 years' },
];

const BarberManagement = () => {
  const [barbers, setBarbers] = useState([]);
  const [allBarbers, setAllBarbers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingBarber, setEditingBarber] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState(undefined);
  const [totalBookingsFilter, setTotalBookingsFilter] = useState(undefined);
  const [averageRatingFilter, setAverageRatingFilter] = useState(undefined);
  const [experienceFilter, setExperienceFilter] = useState(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortName, setSortName] = useState(null);
  const [sortExperience, setSortExperience] = useState(null);
  const [detailBarber, setDetailBarber] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const fetchInitialData = async (searchValue = '') => {
    try {
      const params = {};
      if (searchValue) params.search = searchValue;
      const response = await getAllBarber(params);
      const barbersData = Array.isArray(response.data)
        ? response.data
        : response.data.barbers || [];
      setAllBarbers(barbersData);
      setBarbers(barbersData);
    } catch (error) {
      message.error('Failed to load barber list: ' + error.message);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      fetchInitialData(searchTerm);
    } else {
      fetchInitialData();
    }
    // eslint-disable-next-line
  }, [searchTerm]);

  // filterBarbers chỉ còn lọc các filter khác, không lọc searchTerm nữa
  const filterBarbers = () => {
    let filtered = [...allBarbers];
    if (availabilityFilter !== undefined) {
      filtered = filtered.filter((barber) => barber.isAvailable === availabilityFilter);
    }
    if (totalBookingsFilter !== undefined) {
      filtered = filtered.filter((barber) => (barber.totalBookings || 0) >= totalBookingsFilter);
    }
    if (averageRatingFilter !== undefined) {
      filtered = filtered.filter((barber) => (barber.averageRating || 0) >= averageRatingFilter);
    }
    if (experienceFilter !== undefined) {
      filtered = filtered.filter((barber) => (barber.experienceYears || 0) >= experienceFilter);
    }
    if (sortName) {
      filtered.sort((a, b) => {
        const nameA = a.userId?.name || '';
        const nameB = b.userId?.name || '';
        return sortName === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    }
    if (sortExperience) {
      filtered.sort((a, b) => {
        const expA = a.experienceYears || 0;
        const expB = b.experienceYears || 0;
        return sortExperience === 'asc' ? expA - expB : expB - expA;
      });
    }
    setBarbers(filtered);
  };

  useEffect(() => {
    filterBarbers();
    // eslint-disable-next-line
  }, [availabilityFilter, totalBookingsFilter, averageRatingFilter, experienceFilter, sortName, sortExperience, allBarbers]);

  const handleAddOrUpdateBarber = async (values) => {
    try {
      const barberData = {
        userId: values.userId,
        bio: values.bio,
        experienceYears: values.experienceYears,
        specialties: values.specialties ? values.specialties.split(',').map((s) => s.trim()) : [],
        expertiseTags: values.expertiseTags ? values.expertiseTags.split(',').map((s) => s.trim()) : [],
        hairTypeExpertise: values.hairTypeExpertise ? values.hairTypeExpertise.split(',').map((s) => s.trim()) : [],
        styleExpertise: values.styleExpertise ? values.styleExpertise.split(',').map((s) => s.trim()) : [],
        workingSince: values.workingSince ? values.workingSince.toISOString() : null,
        autoAssignmentEligible: values.autoAssignmentEligible ?? true,
        maxDailyBookings: values.maxDailyBookings ?? 12,
        preferredWorkingHours: {
          start: values.preferredWorkingHours?.start || "09:00",
          end: values.preferredWorkingHours?.end || "18:00"
        },
        profileImageUrl: values.profileImageUrl || null,
        certifications: values.certifications ? values.certifications.split(',').map((s) => s.trim()) : [],
        languages: values.languages ? values.languages.split(',').map((s) => s.trim()) : ["Vietnamese"]
      };

      console.log('Payload sent:', barberData);

      const response = editingBarber
        ? await updateBarber(editingBarber._id, barberData)
        : await createBarber(barberData);

      console.log('Response from updateBarber:', response.data);

      if ([200, 201, 204].includes(response.status)) {
        message.success(`${editingBarber ? 'Updated' : 'Added'} barber successfully`);
        fetchInitialData();
        setIsModalVisible(false);
        form.resetFields();
        setEditingBarber(null);
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Error details:', error.response?.data || error.message);
      message.error(`Failed to ${editingBarber ? 'update' : 'add'} barber: ${errorMessage}`);
    }
  };

  // const showModal = (barber = null) => {
  //   if (barber) {
  //     setEditingBarber(barber);
  //     form.setFieldsValue({
  //       ...barber,
  //       userId: barber.userId?._id,
  //       workingSince: barber.workingSince ? moment(barber.workingSince) : null,
  //       specialties: barber.specialties ? barber.specialties.join(', ') : '',
  //     });
  //   } else {
  //     setEditingBarber(null);
  //     form.resetFields();
  //     form.setFieldsValue({ isAvailable: true, averageRating: 0, ratingCount: 0, totalBookings: 0 });
  //   }
  //   setIsModalVisible(true);
  // };

  const columns = [
    {
      title: () => (
        <span>
          Name{' '}
          {sortName ? (
            sortName === 'asc' ? (
              <SortAscendingOutlined onClick={() => setSortName('desc')} />
            ) : (
              <SortDescendingOutlined onClick={() => setSortName('asc')} />
            )
          ) : (
            <SortAscendingOutlined onClick={() => setSortName('asc')} />
          )}
        </span>
      ),
      dataIndex: ['userId', 'name'],
      key: 'name',
      render: (name) => name || 'N/A',
    },
    {
      title: 'Email',
      dataIndex: ['userId', 'email'],
      key: 'email',
      render: (email) => email || 'N/A',
    },
    {
      title: 'Bio',
      dataIndex: 'bio',
      key: 'bio',
      render: (bio) => bio || 'N/A',
    },
    {
      title: () => (
        <span>
          Experience (Years){' '}
          {sortExperience ? (
            sortExperience === 'asc' ? (
              <SortAscendingOutlined onClick={() => setSortExperience('desc')} />
            ) : (
              <SortDescendingOutlined onClick={() => setSortExperience('asc')} />
            )
          ) : (
            <SortAscendingOutlined onClick={() => setSortExperience('asc')} />
          )}
        </span>
      ),
      dataIndex: 'experienceYears',
      key: 'experienceYears',
      render: (years) => years ?? 'N/A',
    },
    {
      title: 'Specialties',
      dataIndex: 'specialties',
      key: 'specialties',
      render: (specialties) => (specialties && specialties.length > 0 ? specialties.join(', ') : 'N/A'),
    },
    {
      title: 'Average Rating',
      dataIndex: 'averageRating',
      key: 'averageRating',
      render: (rating) => rating.toFixed(1),
    },
    {
      title: 'Rating Count',
      dataIndex: 'ratingCount',
      key: 'ratingCount',
      render: (count) => count ?? 0,
    },
    {
      title: 'Total Bookings',
      dataIndex: 'totalBookings',
      key: 'totalBookings',
      render: (bookings) => bookings ?? 0,
    },
    {
      title: 'Availability',
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      render: (isAvailable) => (isAvailable ? 'Available' : 'Unavailable'),
    },
    {
      title: 'Working Since',
      dataIndex: 'workingSince',
      key: 'workingSince',
      render: (date) => (date ? new Date(date).toLocaleDateString() : 'N/A'),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Button
          shape="circle"
          icon={<EyeOutlined />}
          onClick={() => {
            setDetailBarber(record);
            setIsDetailModalVisible(true);
          }}
          style={{ margin: '0 4px', border: '1px solid #d9d9d9', background: '#fff' }}
        />
      ),
    },
  ];

  return (
    <div className="container mt-4">
      <div className="mb-3 d-flex align-items-center">
        <Input
          placeholder="Search by name, email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 200, marginRight: 10 }}
        />
        <Select
          placeholder="Filter by Availability"
          value={availabilityFilter}
          onChange={(value) => setAvailabilityFilter(value)}
          allowClear
          style={{ width: 200, marginRight: 10 }}
        >
          {AVAILABILITY_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Filter by Total Bookings"
          value={totalBookingsFilter}
          onChange={(value) => setTotalBookingsFilter(value)}
          allowClear
          style={{ width: 200, marginRight: 10 }}
        >
          {TOTAL_BOOKINGS_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Filter by Average Rating"
          value={averageRatingFilter}
          onChange={(value) => setAverageRatingFilter(value)}
          allowClear
          style={{ width: 200, marginRight: 10 }}
        >
          {AVERAGE_RATING_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Filter by Experience"
          value={experienceFilter}
          onChange={(value) => setExperienceFilter(value)}
          allowClear
          style={{ width: 200, marginRight: 10 }}
        >
          {EXPERIENCE_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </div>

      <Table
        dataSource={barbers}
        columns={columns}
        rowKey="_id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: barbers.length,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          showSizeChanger: true,
        }}
      />

      <Modal
        title={editingBarber ? 'Edit Barber' : 'Add New Barber'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddOrUpdateBarber} layout="vertical">
          <Form.Item
            name="userId"
            label="User"
            rules={[{ required: true, message: 'Please enter the user ID!' }]}
          >
            <Input placeholder="Enter User ID" />
          </Form.Item>
          <Form.Item
            name="bio"
            label="Bio"
            rules={[{ required: true, message: 'Please enter the bio!' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="experienceYears"
            label="Experience (Years)"
            rules={[{ required: true, message: 'Please enter years of experience!' }]}
          >
            <InputNumber 
              min={0} 
              style={{ width: '100%' }}
              onKeyPress={(e) => {
                // Chỉ cho phép nhập số từ 0-9
                const charCode = e.which ? e.which : e.keyCode;
                if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name="specialties"
            label="Specialties (comma-separated)"
            rules={[{ required: true, message: 'Please enter specialties!' }]}
          >
            <Input placeholder="e.g., Haircut, Shaving, Styling" />
          </Form.Item>
          <Form.Item
            name="expertiseTags"
            label="Expertise Tags (comma-separated)"
          >
            <Input placeholder="e.g., fade, coloring, beard, long_hair" />
          </Form.Item>
          <Form.Item
            name="hairTypeExpertise"
            label="Hair Type Expertise (comma-separated)"
          >
            <Input placeholder="e.g., straight, wavy, curly, coily" />
          </Form.Item>
          <Form.Item
            name="styleExpertise"
            label="Style Expertise (comma-separated)"
          >
            <Input placeholder="e.g., short, medium, long, beard, mustache" />
          </Form.Item>
          <Form.Item
            name="workingSince"
            label="Working Since"
            rules={[{ required: true, message: 'Please select the working since date!' }]}
          >
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="autoAssignmentEligible"
            label="Auto Assignment Eligible"
            initialValue={true}
          >
            <Select>
              <Option value={true}>Yes</Option>
              <Option value={false}>No</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="maxDailyBookings"
            label="Max Daily Bookings"
            initialValue={12}
          >
            <InputNumber 
              min={1} 
              style={{ width: '100%' }}
              onKeyPress={(e) => {
                // Chỉ cho phép nhập số từ 0-9
                const charCode = e.which ? e.which : e.keyCode;
                if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>
          <Form.Item
            label="Preferred Working Hours"
          >
            <Input.Group compact>
              <Form.Item
                name={["preferredWorkingHours", "start"]}
                noStyle
                rules={[{ required: false }]}
              >
                <Input style={{ width: '50%' }} placeholder="Start (e.g., 09:00)" />
              </Form.Item>
              <Form.Item
                name={["preferredWorkingHours", "end"]}
                noStyle
                rules={[{ required: false }]}
              >
                <Input style={{ width: '50%' }} placeholder="End (e.g., 18:00)" />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item
            name="profileImageUrl"
            label="Profile Image URL"
          >
            <Input placeholder="Enter image URL" />
          </Form.Item>
          <Form.Item
            name="certifications"
            label="Certifications (comma-separated)"
          >
            <Input placeholder="e.g., Certificate A, Certificate B" />
          </Form.Item>
          <Form.Item
            name="languages"
            label="Languages (comma-separated)"
            initialValue="Vietnamese"
          >
            <Input placeholder="e.g., Vietnamese, English" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      {/* Modal xem chi tiết barber */}
      <Modal
        title="Barber Detail"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {detailBarber && (
          <div style={{ display: 'flex', gap: 24 }}>
            {/* Avatar và tên */}
            <div style={{ flex: '0 0 180px', textAlign: 'center' }}>
              <div style={{ marginBottom: 16 }}>
                {detailBarber.profileImageUrl ? (
                  <img
                    src={detailBarber.profileImageUrl}
                    alt="Profile"
                    style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee', boxShadow: '0 2px 8px #eee' }}
                  />
                ) : (
                  <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#bbb', border: '2px solid #eee' }}>
                    <span role="img" aria-label="avatar">👤</span>
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 600, fontSize: 20 }}>{detailBarber.userId?.name || 'N/A'}</div>
              <div style={{ color: '#888', fontSize: 14 }}>{detailBarber.userId?.email || 'N/A'}</div>
              <div style={{ marginTop: 8, fontSize: 13, color: detailBarber.isAvailable ? '#52c41a' : '#f5222d' }}>
                {detailBarber.isAvailable ? 'Available' : 'Unavailable'}
              </div>
            </div>
            {/* Thông tin chi tiết */}
            <div style={{ flex: 1 }}>
              <div style={{ borderBottom: '1px solid #f0f0f0', marginBottom: 12, paddingBottom: 8, fontWeight: 500, fontSize: 16 }}>General Info</div>
              <div style={{ marginBottom: 8 }}><b>Bio:</b> <span style={{ color: '#555' }}>{detailBarber.bio}</span></div>
              <div style={{ marginBottom: 8 }}><b>Experience:</b> <span style={{ color: '#555' }}>{detailBarber.experienceYears} years</span></div>
              <div style={{ marginBottom: 8 }}><b>Working Since:</b> <span style={{ color: '#555' }}>{detailBarber.workingSince ? new Date(detailBarber.workingSince).toLocaleDateString() : 'N/A'}</span></div>
              <div style={{ marginBottom: 8 }}><b>Languages:</b> <span style={{ color: '#555' }}>{detailBarber.languages?.join(', ')}</span></div>
              <div style={{ borderBottom: '1px solid #f0f0f0', margin: '16px 0 12px', paddingBottom: 8, fontWeight: 500, fontSize: 16 }}>Expertise</div>
              <div style={{ marginBottom: 8 }}><b>Specialties:</b> <span style={{ color: '#555' }}>{detailBarber.specialties?.join(', ')}</span></div>
              <div style={{ marginBottom: 8 }}><b>Expertise Tags:</b> <span style={{ color: '#555' }}>{detailBarber.expertiseTags?.join(', ')}</span></div>
              <div style={{ marginBottom: 8 }}><b>Hair Type Expertise:</b> <span style={{ color: '#555' }}>{detailBarber.hairTypeExpertise?.join(', ')}</span></div>
              <div style={{ marginBottom: 8 }}><b>Style Expertise:</b> <span style={{ color: '#555' }}>{detailBarber.styleExpertise?.join(', ')}</span></div>
              <div style={{ marginBottom: 8 }}><b>Certifications:</b> <span style={{ color: '#555' }}>{detailBarber.certifications?.join(', ') || 'N/A'}</span></div>
              <div style={{ borderBottom: '1px solid #f0f0f0', margin: '16px 0 12px', paddingBottom: 8, fontWeight: 500, fontSize: 16 }}>Work & Rating</div>
              <div style={{ marginBottom: 8 }}><b>Auto Assignment:</b> <span style={{ color: '#555' }}>{detailBarber.autoAssignmentEligible ? 'Yes' : 'No'}</span></div>
              <div style={{ marginBottom: 8 }}><b>Max Daily Bookings:</b> <span style={{ color: '#555' }}>{detailBarber.maxDailyBookings}</span></div>
              <div style={{ marginBottom: 8 }}><b>Preferred Working Hours:</b> <span style={{ color: '#555' }}>{detailBarber.preferredWorkingHours?.start} - {detailBarber.preferredWorkingHours?.end}</span></div>
              <div style={{ marginBottom: 8 }}><b>Average Rating:</b> <span style={{ color: '#faad14', fontWeight: 600 }}>{detailBarber.averageRating}</span> <span style={{ color: '#888', fontSize: 13 }}>(from {detailBarber.ratingCount} ratings)</span></div>
              <div style={{ marginBottom: 8 }}><b>Total Bookings:</b> <span style={{ color: '#555' }}>{detailBarber.totalBookings}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BarberManagement;