import React, { useState, useEffect } from 'react';
import { Select, Card, Button, Empty, notification } from 'antd';
import { PlusOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import { getUserAddresses, updateAddress } from '../../services/api';

const { Option } = Select;

const AddressSelector = ({ 
  value, 
  onChange, 
  onAddressSelect,
  isGuest = false,
  provinces = [],
  districts = [],
  wards = [],
  selectedProvince,
  selectedDistrict,
  selectedWard,
  onProvinceChange,
  onDistrictChange,
  onWardChange,
  showNewAddressForm = false,
  setShowNewAddressForm
}) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});

  // Fetch user addresses
  useEffect(() => {
    if (!isGuest) {
      fetchAddresses();
    }
  }, [isGuest]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await getUserAddresses();
      setAddresses(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể tải danh sách địa chỉ'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateEditForm = () => {
    const errors = {};
    const data = { ...editingAddress, ...editFormData };

    if (!data.recipientName || data.recipientName.trim() === '') {
      errors.recipientName = 'Tên người nhận không được để trống!';
    }

    if (!data.phone || data.phone.trim() === '') {
      errors.phone = 'Số điện thoại không được để trống!';
    } else if (!/^[0-9]{10}$/.test(data.phone)) {
      errors.phone = 'Số điện thoại phải đủ 10 chữ số';
    }

    if (!data.province || data.province.trim() === '') {
      errors.province = 'Vui lòng chọn tỉnh/thành phố!';
    }

    if (!data.district || data.district.trim() === '') {
      errors.district = 'Vui lòng chọn quận/huyện!';
    }

    if (!data.ward || data.ward.trim() === '') {
      errors.ward = 'Vui lòng chọn phường/xã!';
    }

    if (!data.street || data.street.trim() === '') {
      errors.street = 'Địa chỉ chi tiết không được để trống!';
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };



  // For guest users, show simple address input
  if (isGuest) {
    return (
      <div>
          <Select
            placeholder="Chọn tỉnh/thành phố"
            onChange={onProvinceChange}
            value={selectedProvince?.code}
            showSearch
            optionFilterProp="children"
          style={{ marginBottom: 8, width: '100%' }}
          >
            {provinces.map(p => <Option key={p.code} value={p.code}>{p.name}</Option>)}
          </Select>
        
          <Select
            placeholder="Chọn quận/huyện"
            onChange={onDistrictChange}
            value={selectedDistrict?.code}
          disabled={!selectedProvince}
            showSearch
            optionFilterProp="children"
          style={{ marginBottom: 8, width: '100%' }}
          >
            {districts.map(d => <Option key={d.code} value={d.code}>{d.name}</Option>)}
          </Select>
        
          <Select
            placeholder="Chọn phường/xã"
            onChange={onWardChange}
            value={selectedWard?.code}
          disabled={!selectedDistrict}
            showSearch
            optionFilterProp="children"
          style={{ marginBottom: 8, width: '100%' }}
          >
            {wards.map(w => <Option key={w.code} value={w.code}>{w.name}</Option>)}
          </Select>
      </div>
    );
  }

  // For logged-in users, show address selection
  const selectedAddress = addresses.find(addr => addr._id === value);

  // If editing an address, render the edit form
  if (editingAddress) {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: 0 }}>Cập nhật địa chỉ</h4>
      </div>

        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Tên người nhận <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              defaultValue={editingAddress.recipientName}
              placeholder="Nhập tên người nhận"
              onChange={(e) => {
                setEditFormData({...editFormData, recipientName: e.target.value});
                if (editErrors.recipientName) {
                  setEditErrors({...editErrors, recipientName: null});
                }
              }}
              style={{ 
                width: '100%',
                padding: '8px 12px',
                border: editErrors.recipientName ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
                borderRadius: 6,
                fontSize: 14
              }}
            />
            {editErrors.recipientName && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                {editErrors.recipientName}
              </div>
            )}
                </div>
                
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Số điện thoại <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              defaultValue={editingAddress.phone}
              placeholder="Nhập số điện thoại"
              onChange={(e) => {
                setEditFormData({...editFormData, phone: e.target.value});
                if (editErrors.phone) {
                  setEditErrors({...editErrors, phone: null});
                }
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: editErrors.phone ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
                borderRadius: 6,
                fontSize: 14
              }}
            />
            {editErrors.phone && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                {editErrors.phone}
              </div>
            )}
        </div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Tỉnh/Thành phố <span style={{ color: 'red' }}>*</span>
            </label>
            <Select
              placeholder="Chọn tỉnh/thành phố"
              defaultValue={editingAddress.province}
              onChange={(value) => {
                setEditFormData({...editFormData, province: value});
                if (editErrors.province) {
                  setEditErrors({...editErrors, province: null});
                }
              }}
              style={{ 
                width: '100%',
                borderColor: editErrors.province ? '#ff4d4f' : undefined
              }}
              showSearch
              optionFilterProp="children"
            >
              {provinces.map(p => <Option key={p.code} value={p.name}>{p.name}</Option>)}
            </Select>
            {editErrors.province && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                {editErrors.province}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Quận/Huyện <span style={{ color: 'red' }}>*</span>
            </label>
            <Select
              placeholder="Chọn quận/huyện"
              defaultValue={editingAddress.district}
              onChange={(value) => {
                setEditFormData({...editFormData, district: value});
                if (editErrors.district) {
                  setEditErrors({...editErrors, district: null});
                }
              }}
              style={{ 
                width: '100%',
                borderColor: editErrors.district ? '#ff4d4f' : undefined
              }}
              showSearch
              optionFilterProp="children"
            >
              {districts.map(d => <Option key={d.code} value={d.name}>{d.name}</Option>)}
            </Select>
            {editErrors.district && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                {editErrors.district}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Phường/Xã <span style={{ color: 'red' }}>*</span>
            </label>
            <Select
              placeholder="Chọn phường/xã"
              defaultValue={editingAddress.ward}
              onChange={(value) => {
                setEditFormData({...editFormData, ward: value});
                if (editErrors.ward) {
                  setEditErrors({...editErrors, ward: null});
                }
              }}
              style={{ 
                width: '100%',
                borderColor: editErrors.ward ? '#ff4d4f' : undefined
              }}
              showSearch
              optionFilterProp="children"
            >
              {wards.map(w => <Option key={w.code} value={w.name}>{w.name}</Option>)}
            </Select>
            {editErrors.ward && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                {editErrors.ward}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Địa chỉ chi tiết <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              defaultValue={editingAddress.street}
              placeholder="Nhập địa chỉ chi tiết (số nhà, tên đường...)"
              onChange={(e) => {
                setEditFormData({...editFormData, street: e.target.value});
                if (editErrors.street) {
                  setEditErrors({...editErrors, street: null});
                }
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: editErrors.street ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
                borderRadius: 6,
                fontSize: 14
              }}
            />
            {editErrors.street && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                {editErrors.street}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: 4, fontWeight: 500 }}>
              <input
                type="checkbox"
                defaultChecked={editingAddress.isDefault}
                disabled={editingAddress.isDefault}
                onChange={(e) => setEditFormData({...editFormData, isDefault: e.target.checked})}
                style={{ marginRight: 8 }}
              />
              Đặt làm địa chỉ mặc định
              {editingAddress.isDefault && (
                <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                  {/* (Đã là địa chỉ mặc định) */}
                </span>
              )}
            </label>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <Button 
              type="default" 
              style={{ flex: 1 }}
              onClick={() => {
                setEditingAddress(null);
                setEditFormData({});
              }}
            >
              Trờ lại
            </Button>
            <Button 
              type="primary" 
              style={{ flex: 1 }}
              onClick={async () => {
                // Validate form first
                if (!validateEditForm()) {
                  return;
                }

                try {
                  // Prepare update data
                  const updateData = {
                    recipientName: editFormData.recipientName || editingAddress.recipientName,
                    phone: editFormData.phone || editingAddress.phone,
                    province: editFormData.province || editingAddress.province,
                    district: editFormData.district || editingAddress.district,
                    ward: editFormData.ward || editingAddress.ward,
                    street: editFormData.street || editingAddress.street,
                    isDefault: editFormData.isDefault !== undefined ? editFormData.isDefault : editingAddress.isDefault
                  };

                  // Call API to update address
                  await updateAddress(editingAddress._id, updateData);
                  
                  notification.success({
                    message: 'Thành công',
                    description: 'Đã cập nhật địa chỉ thành công'
                  });

                  // Reset form and refresh addresses
                  setEditingAddress(null);
                  setEditFormData({});
                  setEditErrors({});
                  fetchAddresses();
                } catch (error) {
                  console.error('Error updating address:', error);
                  notification.error({
                    message: 'Lỗi',
                    description: 'Không thể cập nhật địa chỉ'
                  });
                }
              }}
            >
              Cập nhật
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If showing new address form, render the form
  if (showNewAddressForm) {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: 0 }}>Nhập địa chỉ mới</h4>
        </div>
        
        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Tên người nhận <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Nhập tên người nhận"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Số điện thoại <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Nhập số điện thoại"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Tỉnh/Thành phố <span style={{ color: 'red' }}>*</span>
            </label>
            <Select
              placeholder="Chọn tỉnh/thành phố"
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="children"
            >
              {provinces.map(p => <Option key={p.code} value={p.code}>{p.name}</Option>)}
            </Select>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Quận/Huyện <span style={{ color: 'red' }}>*</span>
            </label>
            <Select
              placeholder="Chọn quận/huyện"
              style={{ width: '100%' }}
              disabled={!selectedProvince}
              showSearch
              optionFilterProp="children"
            >
              {districts.map(d => <Option key={d.code} value={d.code}>{d.name}</Option>)}
            </Select>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Phường/Xã <span style={{ color: 'red' }}>*</span>
            </label>
            <Select
              placeholder="Chọn phường/xã"
              style={{ width: '100%' }}
              disabled={!selectedDistrict}
              showSearch
              optionFilterProp="children"
            >
              {wards.map(w => <Option key={w.code} value={w.code}>{w.name}</Option>)}
            </Select>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Địa chỉ chi tiết <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Nhập địa chỉ chi tiết (số nhà, tên đường...)"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <Button 
              type="default" 
              style={{ flex: 1 }}
              onClick={() => setShowNewAddressForm(false)}
            >
              Trở lại
            </Button>
            <Button 
              type="primary" 
              style={{ flex: 1 }}
              onClick={() => {
                // Handle save new address
                setShowNewAddressForm(false);
                fetchAddresses(); // Refresh address list
              }}
            >
              Lưu địa chỉ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Direct address list display */}
      <div>
        {addresses.length === 0 ? (
          <Empty description="Chưa có địa chỉ nào" />
        ) : (
          <div>
            {addresses.map((address) => (
              <Card
                key={address._id}
                size="small"
                style={{
                  marginBottom: 12,
                  cursor: 'pointer',
                  border: value === address._id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  backgroundColor: value === address._id ? '#f0f8ff' : '#fff'
                }}
                onClick={() => {
                  onChange(address._id);
                  if (onAddressSelect) {
                    onAddressSelect(address);
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {address.recipientName} - {address.phone}
                    </div>
                    <div style={{ color: '#666', fontSize: 14 }}>
                      {address.street}, {address.ward}, {address.district}, {address.province}
                    </div>
                    {address.isDefault && (
                      <div style={{ marginTop: 4 }}>
                        <span style={{ 
                          backgroundColor: '#52c41a', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: 4, 
                          fontSize: 12 
                        }}>
                          Mặc định
                        </span>
                      </div>
                    )}
                  </div>
                                     <div style={{ display: 'flex', gap: 4 }}>
                     <Button
                       type="text"
                       size="small"
                       onClick={(e) => {
                         e.stopPropagation();
                         setEditingAddress(address);
                       }}
                       title="Cập nhật địa chỉ"
                     >
                       Cập nhật
                     </Button>
                   </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        <Button 
          type="dashed" 
          block 
          icon={<PlusOutlined />}
          onClick={() => setShowNewAddressForm(true)}
          style={{ marginTop: 16 }}
        >
          Thêm địa chỉ mới
        </Button>
      </div>
    </div>
  );
};

export default AddressSelector; 