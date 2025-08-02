import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, Select, Button, Card, Checkbox } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

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
    } else {
      form.resetFields();
      setSelectedProvinceLocal(null);
      setSelectedDistrictLocal(null);
      setSelectedWardLocal(null);
      setDistrictsLocal([]);
      setWardsLocal([]);
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

  const handleSubmit = (values) => {
    if (onSubmit) {
      onSubmit(values);
    }
  };

  return (
    <Card
      size="small"
      style={{ marginTop: 16 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
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
              // Chỉ cho phép nhập số (không cho dấu trừ, dấu cộng, dấu chấm)
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              // Loại bỏ tất cả ký tự không phải số (bao gồm dấu trừ, dấu cộng, dấu chấm)
              const value = e.target.value.replace(/[^0-9]/g, '');
              e.target.value = value;
            }}
            onPaste={(e) => {
              // Ngăn chặn paste ký tự không hợp lệ
              e.preventDefault();
              const pastedText = e.clipboardData.getData('text');
              const numbersOnly = pastedText.replace(/[^0-9]/g, '');
              if (numbersOnly.length <= 10) {
                e.target.value = numbersOnly;
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="province"
          label={<span>Tỉnh/Thành phố <span style={{ color: 'red' }}>*</span></span>}
          rules={[
            { 
              validator: (_, value) => {
                if (!value || value.trim() === '') {
                  return Promise.reject(new Error('Vui lòng chọn tỉnh/thành phố!'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Select
            placeholder="Chọn tỉnh/thành phố"
            onChange={async (value) => {
              // Tìm province object từ name
              const province = provinces.find(p => p.name === value);
              if (province) {
                setSelectedProvinceLocal(province);
                setSelectedDistrictLocal(null);
                setSelectedWardLocal(null);
                setWardsLocal([]);
                
                // Fetch districts cho province này
                try {
                  const response = await fetch(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`);
                  const data = await response.json();
                  setDistrictsLocal(data.districts || []);
                } catch (error) {
                  console.error('Error fetching districts:', error);
                  setDistrictsLocal([]);
                }
              }
            }}
            showSearch
            optionFilterProp="children"
          >
            {provinces.map(p => <Option key={p.code} value={p.name}>{p.name}</Option>)}
          </Select>
        </Form.Item>

        <Form.Item
          name="district"
          label={<span>Quận/Huyện <span style={{ color: 'red' }}>*</span></span>}
          rules={[
            { 
              validator: (_, value) => {
                if (!value || value.trim() === '') {
                  return Promise.reject(new Error('Vui lòng chọn quận/huyện!'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Select
            placeholder="Chọn quận/huyện"
            onChange={async (value) => {
              // Tìm district object từ name
              const district = districtsLocal.find(d => d.name === value);
              if (district) {
                setSelectedDistrictLocal(district);
                setSelectedWardLocal(null);
                
                // Fetch wards cho district này
                try {
                  const response = await fetch(`https://provinces.open-api.vn/api/d/${district.code}?depth=2`);
                  const data = await response.json();
                  setWardsLocal(data.wards || []);
                } catch (error) {
                  console.error('Error fetching wards:', error);
                  setWardsLocal([]);
                }
              }
            }}
            disabled={!selectedProvinceLocal}
            showSearch
            optionFilterProp="children"
          >
            {districtsLocal.map(d => <Option key={d.code} value={d.name}>{d.name}</Option>)}
          </Select>
        </Form.Item>

        <Form.Item
          name="ward"
          label={<span>Phường/Xã <span style={{ color: 'red' }}>*</span></span>}
          rules={[
            { 
              validator: (_, value) => {
                if (!value || value.trim() === '') {
                  return Promise.reject(new Error('Vui lòng chọn phường/xã!'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Select
            placeholder="Chọn phường/xã"
            onChange={(value) => {
              // Tìm ward object từ name
              const ward = wardsLocal.find(w => w.name === value);
              if (ward) {
                setSelectedWardLocal(ward);
              }
            }}
            disabled={!selectedDistrictLocal}
            showSearch
            optionFilterProp="children"
          >
            {wardsLocal.map(w => <Option key={w.code} value={w.name}>{w.name}</Option>)}
          </Select>
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