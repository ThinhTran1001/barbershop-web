import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Select, DatePicker, InputNumber } from 'antd';
import { getAllBarber, createBarber, updateBarber } from '../services/api';
import { InfoCircleFilled, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    filterBarbers();
  }, [searchTerm, availabilityFilter, totalBookingsFilter, averageRatingFilter, experienceFilter, sortName, sortExperience]);

  const fetchInitialData = async () => {
    try {
      const response = await getAllBarber();
      console.log('Barber data after fetch:', response.data);
      setAllBarbers(response.data);
      setBarbers(response.data);
    } catch (error) {
      message.error('Failed to load barber list: ' + error.message);
    }
  };

  const filterBarbers = () => {
    let filtered = [...allBarbers];
    if (searchTerm) {
      filtered = filtered.filter((barber) =>
        barber.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
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

  const handleAddOrUpdateBarber = async (values) => {
    try {
      const barberData = {
        ...values,
        workingSince: values.workingSince ? values.workingSince.toISOString() : null,
        specialties: values.specialties ? values.specialties.split(',').map((s) => s.trim()) : [],
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
    // {
    //   title: 'Actions',
    //   key: 'actions',
    //   render: (_, record) => (
    //     <Button onClick={() => showModal(record)} className="me-2">
    //       <InfoCircleFilled />
    //     </Button>
    //   ),
    // },
  ];

  return (
    <div className="container mt-4">
      <div className="mb-3 d-flex align-items-center">
        <Input
          placeholder="Search by name"
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
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="specialties"
            label="Specialties (comma-separated)"
            rules={[{ required: true, message: 'Please enter specialties!' }]}
          >
            <Input placeholder="e.g., Haircut, Shaving, Styling" />
          </Form.Item>
          <Form.Item
            name="averageRating"
            label="Average Rating"
            rules={[{ required: true, message: 'Please enter average rating!' }]}
          >
            <InputNumber min={0} max={5} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="ratingCount"
            label="Rating Count"
            rules={[{ required: true, message: 'Please enter rating count!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="totalBookings"
            label="Total Bookings"
            rules={[{ required: true, message: 'Please enter total bookings!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="isAvailable"
            label="Availability"
            rules={[{ required: true, message: 'Please select availability!' }]}
          >
            <Select>
              {AVAILABILITY_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="workingSince"
            label="Working Since"
            rules={[{ required: true, message: 'Please select the working since date!' }]}
          >
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BarberManagement;