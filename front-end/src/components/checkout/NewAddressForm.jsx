import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, Select, Button, Card, Checkbox, Tabs, List, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

const NewAddressForm = ({
  provinces = [],
  districts = [],
  wards = [],
  selectedProvince,
  selectedDistrict,
  selectedWard,
  onProvinceChange,
  onDistrictChange,
  onWardChange,
  onSubmit,
  onBack,
  loading = false,
  initialValues = null,
  isEditMode = false
}) => {
  const [form] = Form.useForm();
  const [selectedProvinceLocal, setSelectedProvinceLocal] = useState(null);
  const [selectedDistrictLocal, setSelectedDistrictLocal] = useState(null);
  const [selectedWardLocal, setSelectedWardLocal] = useState(null);
  const [districtsLocal, setDistrictsLocal] = useState([]);
  const [wardsLocal, setWardsLocal] = useState([]);
  const [activeTab, setActiveTab] = useState('province');
  const [searchText, setSearchText] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // Fetch districts cho province
  const fetchDistricts = useCallback(async (provinceCode) => {
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      const data = await response.json();
      setDistrictsLocal(data.districts || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setDistrictsLocal([]);
    }
  }, []);

  // Fetch wards cho district
  const fetchWards = useCallback(async (districtCode) => {
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      const data = await response.json();
      setWardsLocal(data.wards || []);
    } catch (error) {
      console.error('Error fetching wards:', error);
      setWardsLocal([]);
    }
  }, []);

  // Reset form khi component mount hoặc khi initialValues thay đổi
  useEffect(() => {
    if (initialValues && isEditMode) {
      // Điền sẵn form với dữ liệu ban đầu
      form.setFieldsValue({
        recipientName: initialValues.recipientName,
        phone: initialValues.phone,
        province: initialValues.province,
        district: initialValues.district,
        ward: initialValues.ward,
        street: initialValues.street,
        isDefault: initialValues.isDefault
      });
      
      // Set local state cho province, district, ward
      const province = provinces.find(p => p.name === initialValues.province);
      const district = districts.find(d => d.name === initialValues.district);
      const ward = wards.find(w => w.name === initialValues.ward);
      
      setSelectedProvinceLocal(province);
      setSelectedDistrictLocal(district);
      setSelectedWardLocal(ward);
      
      // Sử dụng districts và wards từ props thay vì fetch lại
      if (province && districts.length > 0) {
        setDistrictsLocal(districts);
      }
      if (district && wards.length > 0) {
        setWardsLocal(wards);
      }

      // Set address input
      const fullAddress = `${initialValues.province}, ${initialValues.district}, ${initialValues.ward}`;
      setAddressInput(fullAddress);

      // Tự động fetch wards nếu chưa có và đang trong chế độ edit
      if (isEditMode && district && wardsLocal.length === 0) {
        fetchWards(district.code);
      }
    } else {
      form.resetFields();
      setSelectedProvinceLocal(null);
      setSelectedDistrictLocal(null);
      setSelectedWardLocal(null);
      setDistrictsLocal([]);
      setWardsLocal([]);
      setAddressInput('');
    }
    
    // Auto show dropdown if no address is selected
    if (!initialValues || !isEditMode) {
      setShowAddressDropdown(true);
    } else if (isEditMode) {
      // Khi cập nhật, ẩn dropdown mặc định
      setShowAddressDropdown(false);
    }
  }, [form, initialValues, isEditMode, provinces]);

  // Fetch districts và wards khi cần thiết
  useEffect(() => {
    if (initialValues && isEditMode && selectedProvinceLocal && districtsLocal.length === 0) {
      fetchDistricts(selectedProvinceLocal.code);
    }
  }, [initialValues, isEditMode, selectedProvinceLocal, districtsLocal.length, fetchDistricts]);

  useEffect(() => {
    if (initialValues && isEditMode && selectedDistrictLocal && wardsLocal.length === 0) {
      fetchWards(selectedDistrictLocal.code);
    }
  }, [initialValues, isEditMode, selectedDistrictLocal, wardsLocal.length, fetchWards]);

  // Tự động fetch wards khi có selectedDistrictLocal
  useEffect(() => {
    if (selectedDistrictLocal && wardsLocal.length === 0) {
      fetchWards(selectedDistrictLocal.code);
    }
  }, [selectedDistrictLocal, wardsLocal.length, fetchWards]);



  const handleSubmit = (values) => {
    console.log('Form values:', values);
    console.log('Selected province:', selectedProvinceLocal);
    console.log('Selected district:', selectedDistrictLocal);
    console.log('Selected ward:', selectedWardLocal);
    
    // Đảm bảo các giá trị được set đúng
    const formData = {
      ...values,
      province: selectedProvinceLocal?.name || values.province,
      district: selectedDistrictLocal?.name || values.district,
      ward: selectedWardLocal?.name || values.ward
    };
    
    console.log('Final form data:', formData);
    
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const handleProvinceSelect = async (province) => {
    setSelectedProvinceLocal(province);
    setSelectedDistrictLocal(null);
    setSelectedWardLocal(null);
    setWardsLocal([]);
    setActiveTab('district');
    setSearchText(''); // Reset search text
    
    // Update form
    form.setFieldsValue({ 
      province: province.name,
      district: undefined,
      ward: undefined
    });

    // Fetch districts
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`);
      const data = await response.json();
      setDistrictsLocal(data.districts || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setDistrictsLocal([]);
    }
    
    // Keep dropdown open to select district
    setShowAddressDropdown(true);
  };

  const handleDistrictSelect = async (district) => {
    setSelectedDistrictLocal(district);
    setSelectedWardLocal(null);
    setActiveTab('ward');
    setSearchText(''); // Reset search text
    
    // Update form
    form.setFieldsValue({ 
      district: district.name,
      ward: undefined
    });

    // Fetch wards
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/d/${district.code}?depth=2`);
      const data = await response.json();
      setWardsLocal(data.wards || []);
    } catch (error) {
      console.error('Error fetching wards:', error);
      setWardsLocal([]);
    }
    
    // Keep dropdown open to select ward
    setShowAddressDropdown(true);
  };

  const handleWardSelect = (ward) => {
    setSelectedWardLocal(ward);
    setSearchText(''); // Reset search text
    
    // Update form
    form.setFieldsValue({ ward: ward.name });
    
    // Update address input
    const fullAddress = `${selectedProvinceLocal.name}, ${selectedDistrictLocal.name}, ${ward.name}`;
    setAddressInput(fullAddress);
    
    // Auto hide dropdown after selecting complete address
    if (selectedProvinceLocal && selectedDistrictLocal && ward) {
      setShowAddressDropdown(false);
    }
  };

  const filteredProvinces = provinces.filter(province => 
    province.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredDistricts = districtsLocal.filter(district => 
    district.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredWards = wardsLocal.filter(ward => 
    ward.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 'province':
        return filteredProvinces;
      case 'district':
        return filteredDistricts;
      case 'ward':
        return filteredWards;
      default:
        return [];
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'province':
        return 'Tỉnh/Thành phố';
      case 'district':
        return 'Quận/Huyện';
      case 'ward':
        return 'Phường/Xã';
      default:
        return '';
    }
  };

  const renderAddressItem = (item) => {
    const isSelected = 
      (activeTab === 'province' && selectedProvinceLocal?.code === item.code) ||
      (activeTab === 'district' && selectedDistrictLocal?.code === item.code) ||
      (activeTab === 'ward' && selectedWardLocal?.code === item.code);

    return (
      <div
        key={item.code}
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          cursor: 'pointer',
          backgroundColor: '#fff',
          borderLeft: '3px solid transparent',
          transition: 'all 0.2s ease'
        }}
        onClick={() => {
          if (activeTab === 'province') {
            handleProvinceSelect(item);
          } else if (activeTab === 'district') {
            handleDistrictSelect(item);
          } else if (activeTab === 'ward') {
            handleWardSelect(item);
          }
        }}
      >
        <Text style={{ 
          fontWeight: '400',
          color: '#333'
        }}>
          {item.name}
        </Text>
      </div>
    );
  };

  return (
    <Card size="small" style={{ marginTop: 16 }}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="recipientName"
          label={<span>Tên người nhận <span style={{ color: 'red' }}>*</span></span>}
          rules={[
            { 
              validator: (_, value) => {
                if (!value || value.trim() === '') {
                  return Promise.reject(new Error('Tên người nhận không được để trống!'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Input placeholder="Nhập tên người nhận" />
        </Form.Item>

        <Form.Item
          name="phone"
          label={<span>Số điện thoại <span style={{ color: 'red' }}>*</span></span>}
          rules={[
            { 
              validator: (_, value) => {
                if (!value || value.trim() === '') {
                  return Promise.reject(new Error('Số điện thoại không được để trống!'));
                }
                if (!/^[0-9]+$/.test(value)) {
                  return Promise.reject(new Error('Số điện thoại chỉ được nhập số!'));
                }
                if (!value.startsWith('0')) {
                  return Promise.reject(new Error('Số điện thoại phải bắt đầu bằng số 0!'));
                }
                if (!/^[0-9]{10}$/.test(value)) {
                  return Promise.reject(new Error('Số điện thoại phải đủ 10 chữ số'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Input 
            placeholder="Nhập số điện thoại" 
            maxLength={10}
            onKeyPress={(e) => {
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              e.target.value = value;
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pastedText = e.clipboardData.getData('text');
              const numbersOnly = pastedText.replace(/[^0-9]/g, '');
              if (numbersOnly.length <= 10) {
                e.target.value = numbersOnly;
              }
            }}
          />
        </Form.Item>

        {/* Address Selection Section */}
        <Form.Item
          name="province"
          label={<span>Địa chỉ <span style={{ color: 'red' }}>*</span></span>}
          rules={[
            { 
              validator: (_, value) => {
                if (!selectedProvinceLocal) {
                  return Promise.reject(new Error('Vui lòng chọn tỉnh/thành phố!'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px', overflow: 'hidden' }}>
            {/* Address Input */}
            <div style={{ 
              padding: '12px 16px', 
              borderBottom: '1px solid #f0f0f0',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Input
                  placeholder="Chọn địa chỉ từng bước"
                  value={addressInput}
                  readOnly
                  style={{ flex: 1, border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                  onClick={() => {
                    // Toggle dropdown
                    setShowAddressDropdown(!showAddressDropdown);
                    
                    // Nếu đang mở dropdown, luôn chuyển về tab tỉnh/thành phố và reset search
                    if (!showAddressDropdown) {
                      setActiveTab('province');
                      setSearchText('');
                    }
                  }}
                />
                {searchText && (
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    size="small"
                    onClick={() => setSearchText('')}
                  />
                )}
                <Button
                  type="text"
                  icon={showAddressDropdown ? <CloseOutlined /> : <SearchOutlined />}
                  size="small"
                  onClick={() => {
                    // Toggle dropdown
                    setShowAddressDropdown(!showAddressDropdown);
                    
                    // Nếu đang mở dropdown, luôn chuyển về tab tỉnh/thành phố và reset search
                    if (!showAddressDropdown) {
                      setActiveTab('province');
                      setSearchText('');
                    }
                  }}
                />
              </div>
            </div>

            {/* Address Tabs */}
            {showAddressDropdown && (
            <div>
              <div style={{ 
                display: 'flex', 
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: '#fff'
              }}>
                <div
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'province' ? '2px solid #1890ff' : '2px solid transparent',
                    color: activeTab === 'province' ? '#1890ff' : '#666',
                    fontWeight: activeTab === 'province' ? '600' : '400'
                  }}
                  onClick={() => setActiveTab('province')}
                >
                  Tỉnh/Thành phố
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'district' ? '2px solid #1890ff' : '2px solid transparent',
                    color: activeTab === 'district' ? '#1890ff' : '#666',
                    fontWeight: activeTab === 'district' ? '600' : '400',
                    opacity: selectedProvinceLocal ? 1 : 0.5
                  }}
                  onClick={() => {
                    if (selectedProvinceLocal) {
                      setActiveTab('district');
                    } else {
                      // Nếu chưa chọn tỉnh, tự động chuyển về tab tỉnh trước
                      setActiveTab('province');
                    }
                  }}
                >
                  Quận/Huyện
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'ward' ? '2px solid #1890ff' : '2px solid transparent',
                    color: activeTab === 'ward' ? '#1890ff' : '#666',
                    fontWeight: activeTab === 'ward' ? '600' : '400',
                    opacity: (selectedDistrictLocal || (isEditMode && selectedProvinceLocal)) ? 1 : 0.5
                  }}
                  onClick={() => {
                    // Trong chế độ edit, luôn cho phép click vào tab ward nếu đã có province
                    if (isEditMode && selectedProvinceLocal) {
                      setActiveTab('ward');
                      // Nếu chưa có district, tự động chọn district đầu tiên
                      if (!selectedDistrictLocal && districtsLocal.length > 0) {
                        const firstDistrict = districtsLocal[0];
                        setSelectedDistrictLocal(firstDistrict);
                        fetchWards(firstDistrict.code);
                      } else if (selectedDistrictLocal && wardsLocal.length === 0) {
                        fetchWards(selectedDistrictLocal.code);
                      }
                    } else if (selectedDistrictLocal) {
                      setActiveTab('ward');
                      // Đảm bảo có wards data khi click vào tab ward
                      if (wardsLocal.length === 0) {
                        fetchWards(selectedDistrictLocal.code);
                      }
                    } else if (selectedProvinceLocal) {
                      // Nếu chưa chọn quận nhưng đã có tỉnh, chuyển về tab quận
                      setActiveTab('district');
                    } else {
                      // Nếu chưa có tỉnh, chuyển về tab tỉnh
                      setActiveTab('province');
                    }
                  }}
                >
                  Phường/Xã
                </div>
              </div>

              {/* Search Input */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                <Input
                  placeholder={`Tìm kiếm ${getTabTitle().toLowerCase()}`}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                  allowClear
                />
              </div>

              {/* Address List */}
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto',
                backgroundColor: '#fff'
              }}>
                {getCurrentData().length > 0 ? (
                  getCurrentData().map(renderAddressItem)
                ) : (
                  <div style={{ 
                    padding: '40px 16px', 
                    textAlign: 'center', 
                    color: '#999' 
                  }}>
                    {searchText ? 'Không tìm thấy kết quả' : 'Đang tải...'}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </Form.Item>

        {/* Hidden fields for validation */}
        <Form.Item 
          name="district" 
          hidden
          rules={[
            { 
              validator: (_, value) => {
                if (!selectedDistrictLocal) {
                  return Promise.reject(new Error('Vui lòng chọn quận/huyện!'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item 
          name="ward" 
          hidden
          rules={[
            { 
              validator: (_, value) => {
                if (!selectedWardLocal) {
                  return Promise.reject(new Error('Vui lòng chọn phường/xã!'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="street"
          label={<span>Địa chỉ chi tiết <span style={{ color: 'red' }}>*</span></span>}
          rules={[
            { 
              validator: (_, value) => {
                if (!value || value.trim() === '') {
                  return Promise.reject(new Error('Địa chỉ chi tiết không được để trống!'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Input.TextArea
            placeholder="Số nhà, tên đường, tên khu phố..."
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="isDefault"
          valuePropName="checked"
        >
          <Checkbox>Đặt làm địa chỉ mặc định</Checkbox>
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              onClick={onBack}
              style={{ flex: 1 }}
            >
              Trở lại
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<PlusOutlined />}
              style={{ flex: 1 }}
              disabled={!selectedProvinceLocal || !selectedDistrictLocal || !selectedWardLocal}
            >
              {isEditMode ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
            </Button>
          </div>
        </Form.Item>
      
      </Form>
    </Card>
  );
};

export default NewAddressForm; 