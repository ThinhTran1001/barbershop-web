import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Button,
  Form,
  Input,
  Card,
  Divider,
  notification,
  Empty,
  Select,
  Modal,
  Tag,
  Radio,
  Typography,
  message,
} from "antd";
import { ShoppingCartOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserCart } from "../../context/UserCartContext";
import {
  createOrder,
  getVoucherByUser,
  getProfile,
  createAddress,
  getUserAddresses,
  setDefaultAddress,
  deleteAddress,
} from "../../services/api";
import "../../css/checkout/checkout.css";
import { useAuth } from "../../context/AuthContext";
import AddressSelector from "../../components/checkout/AddressSelector";
import NewAddressForm from "../../components/checkout/NewAddressForm";

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const Checkout = () => {
  /* --------------------------- App Contexts & Hooks --------------------------- */
  const { cart, clearCart, fetchCart } = useUserCart();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  /* --------------------------------- States --------------------------------- */
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  
  // Address management states
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [addressRefreshTrigger, setAddressRefreshTrigger] = useState(0);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [addressDetail, setAddressDetail] = useState("");
  
  // Edit address states
  const [editingAddress, setEditingAddress] = useState(null);
  const [showEditAddressForm, setShowEditAddressForm] = useState(false);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Fetch provinces on mount
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data));
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      fetch(`https://provinces.open-api.vn/api/p/${selectedProvince.code}?depth=2`)
        .then(res => res.json())
        .then(data => setDistricts(data.districts || []));
    } else {
      setDistricts([]);
      setWards([]);
    }
    setSelectedDistrict(null);
    setSelectedWard(null);
  }, [selectedProvince]);

  // Fetch wards when district changes
  useEffect(() => {
    if (selectedDistrict) {
      fetch(`https://provinces.open-api.vn/api/d/${selectedDistrict.code}?depth=2`)
        .then(res => res.json())
        .then(data => setWards(data.wards || []));
    } else {
      setWards([]);
    }
    setSelectedWard(null);
  }, [selectedDistrict]);

  /* ----------------------------- Derived values ------------------------------ */
  const buyNowItems = location.state?.products;
  const itemsToCheckout = buyNowItems?.length ? buyNowItems : cart.items;

  const subtotal = useMemo(
    () =>
      itemsToCheckout.reduce((sum, item) => {
        const raw = item.price || item.product?.price || 0;
        const discount = item.discount || item.product?.discount || 0;
        const price = discount > 0 ? raw * (1 - discount / 100) : raw;
        return sum + price * item.quantity;
      }, 0),
    [itemsToCheckout]
  );

  const voucherDiscount = useMemo(() => {
    if (!selectedVoucher) return 0;
    // Kiểm tra điều kiện áp dụng voucher
    if (selectedVoucher.minOrderAmount && subtotal < selectedVoucher.minOrderAmount) {
      return 0;
    }
    // Kiểm tra giới hạn sử dụng
    if (selectedVoucher.usageLimit && selectedVoucher.usedCount >= selectedVoucher.usageLimit) {
      return 0;
    }
    // Tính giảm giá
    let discount = selectedVoucher.type === "percent"
      ? (subtotal * selectedVoucher.value) / 100
      : selectedVoucher.value;
    // Áp dụng maxDiscountAmount cho percent
    if (selectedVoucher.type === "percent" && selectedVoucher.maxDiscountAmount > 0) {
      discount = Math.min(discount, selectedVoucher.maxDiscountAmount);
    }
    // Đảm bảo không giảm quá subtotal
    return Math.min(discount, subtotal);
  }, [selectedVoucher, subtotal]);

  const grandTotal = Math.max(0, subtotal - voucherDiscount);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const handleSubmit = async (values) => {

    let userId = user?._id;

    if (!userId) {
      try {
        const profileRes = await getProfile();
        userId = profileRes.data?.data?._id || null;
      } catch (e) {
        console.warn("Không lấy được userId từ getProfile()", e);
        userId = null;
      }
    }

    if (itemsToCheckout.length === 0) {
      notification.warning({
        message: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm trước khi thanh toán",
        placement: "topRight",
      });
      return;
    }

    // Kiểm tra địa chỉ giao hàng
    if (user && !selectedAddress) {
      notification.warning({
        message: "Thiếu thông tin địa chỉ",
        description: "Vui lòng chọn địa chỉ giao hàng",
        placement: "topRight",
      });
      return;
    }
    
    if (!user && (!selectedProvince || !selectedDistrict || !selectedWard || !addressDetail)) {
      notification.warning({
        message: "Thiếu thông tin địa chỉ",
        description: "Vui lòng điền đầy đủ thông tin địa chỉ",
        placement: "topRight",
      });
      return;
    }

    setLoading(true);

    try {
      // Tính toán lại để đảm bảo chính xác
      const originalSubtotal = itemsToCheckout.reduce((sum, item) => {
        const rawPrice = item.price || item.product?.price || 0;
        return sum + rawPrice * item.quantity;
      }, 0);

      const discountedSubtotal = itemsToCheckout.reduce((sum, item) => {
        const rawPrice = item.price || item.product?.price || 0;
        const discount = item.discount || item.product?.discount || 0;
        const finalPrice = discount > 0 ? rawPrice * (1 - discount / 100) : rawPrice;
        return sum + finalPrice * item.quantity;
      }, 0);

      // Tính voucher discount dựa trên giá sau khi giảm sản phẩm
      let finalVoucherDiscount = 0;
      if (selectedVoucher) {
        if (selectedVoucher.minOrderAmount && discountedSubtotal < selectedVoucher.minOrderAmount) {
          notification.warning({
            message: "Voucher không hợp lệ",
            description: `Đơn hàng tối thiểu phải ${formatPrice(selectedVoucher.minOrderAmount)} để sử dụng voucher này`,
            placement: "topRight",
          });
          setLoading(false);
          return;
        }

        if (selectedVoucher.usageLimit && selectedVoucher.usedCount >= selectedVoucher.usageLimit) {
          notification.warning({
            message: "Voucher đã hết lượt sử dụng",
            description: "Voucher này đã được sử dụng hết số lượt cho phép",
            placement: "topRight",
          });
          setLoading(false);
          return;
        }

        if (selectedVoucher.type === "percent" && selectedVoucher.maxDiscountAmount > 0) {
          finalVoucherDiscount = selectedVoucher.maxDiscountAmount;
        } else if (selectedVoucher.type === "percent") {
          finalVoucherDiscount = (discountedSubtotal * selectedVoucher.value) / 100;
        } else {
          finalVoucherDiscount = selectedVoucher.value;
        }
        finalVoucherDiscount = Math.min(finalVoucherDiscount, discountedSubtotal);
      }

      const finalTotal = Math.max(0, discountedSubtotal - finalVoucherDiscount);

      const orderItems = itemsToCheckout.map((item) => {
        const rawPrice = item.price || item.product?.price || 0;
        const discount = item.discount || item.product?.discount || 0;
        const finalPrice = discount > 0 ? rawPrice * (1 - discount / 100) : rawPrice;

        const productId = item.productId || item.id || item._id || item.product?._id;

        return {
          productId: productId,
          quantity: item.quantity,
          price: finalPrice, // Giá sau khi giảm sản phẩm
          originalPrice: rawPrice, // Giá gốc để backend có thể tính toán
        };
      });

             // Xử lý địa chỉ giao hàng
       let shippingAddress = '';
       let customerName = values.name;
       let customerPhone = values.phone;

       if (user && selectedAddressId && selectedAddress) {
         // User đã đăng nhập và chọn địa chỉ có sẵn
         shippingAddress = `${selectedAddress.street}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.province}`;
         customerName = selectedAddress.recipientName;
         customerPhone = selectedAddress.phone;
       } else if (user && showNewAddressForm) {
         // User đã đăng nhập và nhập địa chỉ mới
         shippingAddress = `${values.street}, ${selectedWard?.name}, ${selectedDistrict?.name}, ${selectedProvince?.name}`;
         customerName = values.recipientName || values.name;
         customerPhone = values.phone;
       } else {
         // Guest user
         shippingAddress = `${addressDetail}, ${selectedWard?.name}, ${selectedDistrict?.name}, ${selectedProvince?.name}`;
         customerName = values.name;
         customerPhone = values.phone;
       }

      const orderData = {
         customerName: customerName,
         customerEmail: user ? user.email : values.email, // Lấy email từ user đã đăng nhập hoặc từ form guest
         customerPhone: customerPhone,
        shippingAddress: shippingAddress,
        addressId: user && selectedAddressId ? selectedAddressId : undefined, // Thêm addressId nếu user chọn địa chỉ có sẵn
        paymentMethod: values.paymentMethod,
        items: orderItems,
        voucherId: selectedVoucher ? selectedVoucher._id || selectedVoucher.id : undefined,
        originalSubtotal, // Tổng giá gốc
        discountedSubtotal, // Tổng giá sau giảm sản phẩm
        voucherDiscount: finalVoucherDiscount, // Số tiền giảm từ voucher
        totalAmount: finalTotal, // Tổng cuối cùng
      };

      const res = await createOrder(orderData);

      if (orderData.paymentMethod === 'bank' && res.data?.redirectUrl) {
        // Lưu thông tin đơn hàng tạm vào localStorage
        const draftToStore = {
          ...res.data.orderDraft,
          userId
        };
        localStorage.setItem("pendingOrder", JSON.stringify(draftToStore));

        window.location.href = res.data.redirectUrl; // chuyển sang trang PayOS
      } else {
        if (!buyNowItems?.length) clearCart();

        setOrderSuccess(true);
        notification.success({
          message: "Đặt hàng thành công!",
          description: "Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ sớm.",
          placement: "topRight",
        });
      }

    } catch (error) {
      console.error(error);
      notification.error({
        message: "Lỗi đặt hàng",
        description: error.response?.data?.message || "Vui lòng thử lại sau!",
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- Fetch user/vc ------------------------------ */
  useEffect(() => {
    const initData = async () => {
      if (!user) return;

      /* ---- Điền sẵn thông tin ---- */
      const ui = { name: user.name || "", email: user.email || "", phone: user.phone || "" };
      if (!ui.name || !ui.phone) {
        try {
          const profileRes = await getProfile();
          const p = profileRes.data?.data || profileRes.data;
          ui.name = p.name || ui.name;
          ui.email = p.email || ui.email;
          ui.phone = p.phone || ui.phone;
        } catch (e) {
          console.error("Err profile", e);
        }
      }
      form.setFieldsValue(ui);

      /* ---- Lấy voucher ---- */
      try {
        const res = await getVoucherByUser();
        setVouchers(res.data?.data || []);
      } catch (e) {
        console.error("Err vouchers", e);
        setVouchers([]);
      }
    };

    initData();
  }, [user, form]);

  // Tự động chọn địa chỉ mặc định khi user đã đăng nhập
  useEffect(() => {
    if (user && !selectedAddressId) {
      // Lấy danh sách địa chỉ của user và chọn địa chỉ mặc định
      const fetchUserAddresses = async () => {
        try {
          const response = await getUserAddresses();
          const addresses = response.data?.data || [];
          setUserAddresses(addresses); // Cập nhật state userAddresses
          
          // Tìm địa chỉ mặc định
          let defaultAddress = addresses.find(addr => addr.isDefault);
          
          // Nếu không có địa chỉ mặc định nhưng có địa chỉ, chọn địa chỉ đầu tiên
          if (!defaultAddress && addresses.length > 0) {
            defaultAddress = addresses[0];
          }
          
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress._id);
            setSelectedAddress(defaultAddress);
            // Cập nhật form values với thông tin địa chỉ mặc định
            form.setFieldsValue({
              name: defaultAddress.recipientName || '',
              phone: defaultAddress.phone || ''
            });
          }
          setAddressesLoaded(true);
        } catch (error) {
          console.error("Error fetching user addresses:", error);
          setAddressesLoaded(true);
        }
      };
      
      fetchUserAddresses();
    } else if (!user) {
      setAddressesLoaded(true);
    }
  }, [user, selectedAddressId, form]);

  // Luôn fetch lại cart khi vào trang checkout để đảm bảo lấy số lượng mới nhất
  useEffect(() => {
    fetchCart();
  }, []);

  // Hàm fetch user addresses
  const fetchUserAddresses = async () => {
    try {
      const response = await getUserAddresses();
      const addresses = response.data?.data || [];
      setUserAddresses(addresses);
      return addresses;
    } catch (error) {
      console.error("Error fetching user addresses:", error);
      return [];
    }
  };

  // Hàm xử lý chỉnh sửa địa chỉ
  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowEditAddressForm(true);
    setShowNewAddressForm(false);
  };

  // Hàm xử lý cập nhật địa chỉ
  const handleUpdateAddress = async (values) => {
    try {
      // Import updateAddress function
      const { updateAddress } = await import('../../services/api');
      
      // Nếu đang set địa chỉ này thành mặc định
      if (values.isDefault) {
        // Tìm địa chỉ mặc định hiện tại và bỏ mặc định
        const currentDefaultAddress = userAddresses.find(addr => addr.isDefault && addr._id !== editingAddress._id);
        if (currentDefaultAddress) {
          await updateAddress(currentDefaultAddress._id, { ...currentDefaultAddress, isDefault: false });
        }
      }
      
      // Cập nhật địa chỉ hiện tại
      await updateAddress(editingAddress._id, values);
      
      notification.success({
        message: 'Thành công',
        description: 'Đã cập nhật địa chỉ thành công'
      });
      
      setShowEditAddressForm(false);
      setEditingAddress(null);
      
      // Refresh danh sách địa chỉ
      await fetchUserAddresses();
      
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: 'Không thể cập nhật địa chỉ: ' + error.message
      });
    }
  };

  // Hàm xử lý xóa địa chỉ
  const handleDeleteAddress = async (addressId) => {
    try {
      const response = await deleteAddress(addressId);
      if (response.data.success) {
        notification.success({
          message: 'Thành công',
          description: 'Đã xóa địa chỉ thành công'
        });
        
        // Nếu địa chỉ bị xóa là địa chỉ đang được chọn, reset selection
        if (selectedAddressId === addressId) {
          setSelectedAddressId(null);
          setSelectedAddress(null);
        }
        
        // Refresh danh sách địa chỉ
        await fetchUserAddresses();
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: 'Không thể xóa địa chỉ: ' + error.message
      });
    }
  };

  // Hàm hiển thị chi tiết voucher
  const [viewingVoucher, setViewingVoucher] = useState(null);

  // Hiển thị hạn dùng dạng đếm ngược
  function getDaysLeft(endDate) {
    if (!endDate) return '';
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `Còn ${diff} ngày` : (diff === 0 ? 'Hết hạn hôm nay' : 'Đã hết hạn');
  }

  /* ------------------------------ Empty / Success --------------------------- */
  if (orderSuccess) {
    return (
      <div className="checkout-empty">
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
          description="Đặt hàng thành công!"
        >
          <Button type="primary" onClick={() => navigate("/")}>Về trang chủ</Button>
        </Empty>
      </div>
    );
  }

  if (!itemsToCheckout.length) {
    return (
      <div className="checkout-empty">
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
          description="Không có sản phẩm để thanh toán"
        >
          <Button type="primary" onClick={() => navigate("/products")}>Tiếp tục mua sắm</Button>
        </Empty>
      </div>
    );
  }

  /* --------------------------------- Render --------------------------------- */
  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Thanh toán</h1>
      </div>
      <div className="checkout-content">
        {/* ================= FORM ================= */}
        <div className="checkout-form-section">
          <Card title="Thông tin giao hàng" className="checkout-card">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                             {/* Thông tin khách hàng cho guest user */}
               {!user && (
                 <>
              <Form.Item
                name="name"
                label="Họ và tên"
                rules={[
                  { required: true, message: "Vui lòng nhập họ tên!" },
                  { validator: (_, value) => value && value.trim() !== '' ? Promise.resolve() : Promise.reject('Họ tên không được để trống hoặc chỉ chứa khoảng trắng!') }
                ]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại!" },
                  { pattern: /^[0-9]{10}$/, message: "Số điện thoại phải đủ 10 chữ số" },
                  { validator: (_, value) => value && value.trim() !== '' ? Promise.resolve() : Promise.reject('Số điện thoại không được để trống hoặc chỉ chứa khoảng trắng!') }
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email!" },
                       { type: 'email', message: "Email không hợp lệ!" },
                  { validator: (_, value) => value && value.trim() !== '' ? Promise.resolve() : Promise.reject('Email không được để trống hoặc chỉ chứa khoảng trắng!') }
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
                 </>
               )}

              {/* Địa chỉ giao hàng */}
              <Form.Item
                name="addressId"
                label="Địa chỉ giao hàng"
                rules={[
                  { 
                    required: addressesLoaded && (!user || !selectedAddress), 
                    message: "Chọn địa chỉ giao hàng!" 
                  }
                ]}
              >
                <div>
                  {selectedAddress ? (
                   <div 
                       style={{ 
                         border: '1px solid #e8e8e8', 
                         borderRadius: 8, 
                         padding: 16, 
                         backgroundColor: '#fff',
                         position: 'relative'
                       }}
                     >
                       <div style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         justifyContent: 'space-between',
                         flexWrap: 'wrap',
                         gap: 8
                       }}>
                         <div style={{ 
                           fontSize: 14, 
                           color: '#333',
                           flex: 1,
                           minWidth: 0
                         }}>
                           <span style={{ fontWeight: 600 }}>
                             {selectedAddress.recipientName} {selectedAddress.phone}
                           </span>
                           <span style={{ marginLeft: 8 }}>
                             {selectedAddress.street}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.province}
                           </span>
                         </div>
                         
                                                   <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8,
                            flexShrink: 0,
                            minWidth: 'fit-content'
                          }}>
                            {selectedAddress.isDefault && (
                              <span style={{ 
                                border: '1px solid #52c41a', 
                                backgroundColor: '#f6ffed', 
                                color: '#52c41a', 
                                padding: '4px 8px', 
                                borderRadius: 4, 
                                fontSize: 12,
                                fontWeight: 600,
                                minWidth: '60px',
                                textAlign: 'center',
                                boxShadow: '0 1px 2px rgba(82, 196, 26, 0.1)'
                              }}>
                                Mặc Định
                              </span>
                            )}
                            <Button 
                              type="primary" 
                              size="small"
                              style={{ 
                                backgroundColor: '#1890ff',
                                borderColor: '#1890ff',
                                color: '#fff', 
                                padding: '4px 12px', 
                                height: 'auto',
                                fontSize: 14,
                                fontWeight: 500,
                                borderRadius: 4,
                                boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={async () => {
                                setShowNewAddressForm(false); // Reset về danh sách địa chỉ
                                // Refresh danh sách địa chỉ khi mở modal
                                await fetchUserAddresses();
                                // Tự động chọn địa chỉ hiện tại khi mở modal
                                if (selectedAddress) {
                                  setSelectedAddressId(selectedAddress._id);
                                }
                                setAddressModalVisible(true);
                              }}
                            >
                              Thay Đổi
                            </Button>
                          </div>
                       </div>
                       
                       
                     </div>
                  ) : (
                    <Button 
                      type="dashed" 
                      block 
                      onClick={async () => {
                        setShowNewAddressForm(false); // Reset về danh sách địa chỉ
                        // Refresh danh sách địa chỉ khi mở modal
                        await fetchUserAddresses();
                        setAddressModalVisible(true);
                      }}
                      style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      Chọn địa chỉ giao hàng
                    </Button>
                  )}
                </div>
              </Form.Item>





              {/* Modal địa chỉ giao hàng */}
              <Modal
                title={showNewAddressForm ? "Thêm địa chỉ mới" : showEditAddressForm ? "Cập nhật địa chỉ" : "Chọn địa chỉ giao hàng"}
                open={addressModalVisible}
                onCancel={() => {
                  setAddressModalVisible(false);
                  // Không reset selectedAddressId để giữ nguyên địa chỉ đã chọn
                  setShowNewAddressForm(false);
                  setShowEditAddressForm(false);
                  setEditingAddress(null);
                }}
                footer={showNewAddressForm || showEditAddressForm ? null : [
                  <Button key="cancel" onClick={() => {
                    setAddressModalVisible(false);
                    // Không reset selectedAddressId để giữ nguyên địa chỉ đã chọn
                  }}>
                    Huỷ
                  </Button>,
                  <Button 
                    key="submit" 
                    type="primary" 
                    onClick={() => {
                      if (selectedAddressId) {
                        const selectedAddress = userAddresses.find(addr => addr._id === selectedAddressId);
                        if (selectedAddress) {
                          setSelectedAddress(selectedAddress);
                          setAddressModalVisible(false);
                          // Cập nhật form values với thông tin địa chỉ được chọn
                          form.setFieldsValue({
                            name: selectedAddress?.recipientName || '',
                            phone: selectedAddress?.phone || ''
                          });
                        }
                      }
                    }}
                    disabled={!selectedAddressId}
                  >
                    Xác nhận
                  </Button>
                ]}
                width={700}
                maskClosable={false}
                closable={false}
              >
                {user ? (
                  // User đã đăng nhập - hiển thị danh sách địa chỉ và form thêm mới
                  <div>
                    {showEditAddressForm ? (
                      <NewAddressForm
                        provinces={provinces}
                        districts={districts}
                        wards={wards}
                        selectedProvince={null}
                        selectedDistrict={null}
                        selectedWard={null}
                        onProvinceChange={code => {
                          const province = provinces.find(p => p.code === code);
                          // Không update state chính, chỉ để form tự quản lý
                        }}
                        onDistrictChange={code => {
                          const district = districts.find(d => d.code === code);
                          // Không update state chính, chỉ để form tự quản lý
                        }}
                        onWardChange={code => {
                          const ward = wards.find(w => w.code === code);
                          // Không update state chính, chỉ để form tự quản lý
                        }}
                        onBack={() => {
                          setShowEditAddressForm(false);
                          setEditingAddress(null);
                        }}
                        onSubmit={handleUpdateAddress}
                        initialValues={editingAddress}
                        isEditMode={true}
                      />
                    ) : !showNewAddressForm ? (
                      <div>
                        {userAddresses.length > 0 ? (
                          <Radio.Group 
                            value={selectedAddressId} 
                            onChange={(e) => setSelectedAddressId(e.target.value)}
                            style={{ width: '100%' }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {userAddresses.map((address) => (
                                <div 
                                  key={address._id}
                                  style={{
                                    border: selectedAddressId === address._id ? '2px solid #52c41a' : '1px solid #e8e8e8',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    background: selectedAddressId === address._id ? '#f6ffed' : '#fff',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                    <Radio 
                                      value={address._id} 
                                      style={{ marginRight: '12px', flexShrink: 0 }}
                                      onClick={() => setSelectedAddressId(address._id)}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ 
                                        fontWeight: '600', 
                                        marginBottom: '4px',
                                        fontSize: '14px',
                                        color: '#333',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}>
                                        {address.recipientName} - {address.phone}
                                      </div>
                                      <div style={{ 
                                        color: '#666', 
                                        fontSize: '13px',
                                        lineHeight: '1.4'
                                      }}>
                                        {address.street}, {address.ward}, {address.district}, {address.province}
                                      </div>
                                      {address.isDefault && (
                                        <Tag color="green" style={{ marginTop: '4px', fontSize: '11px' }}>Mặc định</Tag>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{ 
                                    display: 'flex', 
                                    gap: '4px', 
                                    alignItems: 'center',
                                    marginTop: '8px'
                                  }}>
                                    <Button 
                                      type="text" 
                                      size="small"
                                      icon={<EditOutlined />}
                                      style={{ 
                                        color: '#1890ff',
                                        padding: '2px 6px',
                                        height: '24px',
                                        fontSize: '11px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2px'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditAddress(address);
                                      }}
                                    >
                                      Cập nhật
                                    </Button>
                                    <Button 
                                      type="text" 
                                      size="small"
                                      icon={<DeleteOutlined />}
                                      danger
                                      disabled={address.isDefault}
                                      style={{ 
                                        padding: '2px 6px',
                                        height: '24px',
                                        fontSize: '11px',
                                        border: '1px solid #ff4d4f',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                        opacity: address.isDefault ? 0.5 : 1,
                                        cursor: address.isDefault ? 'not-allowed' : 'pointer'
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (address.isDefault) {
                                          message.warning('Không thể xóa địa chỉ mặc định. Vui lòng set địa chỉ khác làm mặc định trước.');
                                          return;
                                        }
                                        // Hiển thị confirm dialog
                                        console.log('Setting confirm dialog to show');
                                        setConfirmDialog({
                                          show: true,
                                          title: 'Xác nhận xóa địa chỉ',
                                          message: `Bạn có muốn xóa địa chỉ "${address.recipientName} - ${address.phone}" khỏi danh sách không?`,
                                          onConfirm: () => {
                                            handleDeleteAddress(address._id);
                                            setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
                                          }
                                        });
                                      }}
                                    >
                                      Xóa
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Radio.Group>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <Text type="secondary">Bạn chưa có địa chỉ nào được lưu.</Text>
                            <br />
                            <Button 
                              type="primary" 
                              onClick={() => setShowNewAddressForm(true)}
                              style={{ marginTop: '16px' }}
                            >
                              Thêm địa chỉ mới
                            </Button>
                          </div>
                        )}
                        
                        {userAddresses.length > 0 && (
                          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e8e8e8' }}>
                            <Button 
                              type="dashed" 
                              block
                              onClick={() => setShowNewAddressForm(true)}
                              style={{ height: '40px' }}
                            >
                              + Thêm địa chỉ mới
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <NewAddressForm
                        provinces={provinces}
                        districts={districts}
                        wards={wards}
                        selectedProvince={null}
                        selectedDistrict={null}
                        selectedWard={null}
                        onProvinceChange={code => {
                          const province = provinces.find(p => p.code === code);
                          // Không update state chính, chỉ để form tự quản lý
                        }}
                        onDistrictChange={code => {
                    const district = districts.find(d => d.code === code);
                          // Không update state chính, chỉ để form tự quản lý
                        }}
                        onWardChange={code => {
                          const ward = wards.find(w => w.code === code);
                          // Không update state chính, chỉ để form tự quản lý
                        }}
                        onBack={() => setShowNewAddressForm(false)}
                        onSubmit={async (values) => {
                          try {
                            setLoading(true);
                            
                            // Kiểm tra xem đây có phải là địa chỉ đầu tiên không
                            const addressesResponse = await getUserAddresses();
                            const existingAddresses = addressesResponse.data?.data || [];
                            const isFirstAddress = existingAddresses.length === 0;
                            
                            const addressData = {
                              ...values,
                              isDefault: isFirstAddress // Địa chỉ đầu tiên sẽ là mặc định
                            };
                            
                            const response = await createAddress(addressData);
                            const newAddress = response.data?.data;
                            
                            // Chỉ tự động chọn nếu đây là địa chỉ đầu tiên
                            if (isFirstAddress) {
                              setSelectedAddressId(newAddress._id);
                              setSelectedAddress(newAddress);
                              setAddressModalVisible(false);
                            } else {
                              // Nếu không phải địa chỉ đầu tiên, chỉ quay lại danh sách
                              setShowNewAddressForm(false);
                            }
                            
                            // Refresh danh sách địa chỉ
                            await fetchUserAddresses();
                            
                            notification.success({
                              message: 'Thành công',
                              description: isFirstAddress 
                                ? 'Địa chỉ mới đã được thêm và đặt làm mặc định' 
                                : 'Địa chỉ mới đã được thêm thành công'
                            });
                          } catch (error) {
                            notification.error({
                              message: 'Lỗi',
                              description: error.response?.data?.message || 'Không thể thêm địa chỉ mới'
                            });
                          } finally {
                            setLoading(false);
                          }
                        }}
                        loading={loading}
                      />
                    )}
                  </div>
                ) : (
                  // Guest user - hiển thị form nhập địa chỉ
                  <div>
                    <Form.Item
                      name="name"
                      label="Họ và tên"
                      rules={[
                        { required: true, message: "Vui lòng nhập họ tên!" },
                        { validator: (_, value) => value && value.trim() !== '' ? Promise.resolve() : Promise.reject('Họ tên không được để trống hoặc chỉ chứa khoảng trắng!') }
                      ]}
                    >
                      <Input placeholder="Nhập họ và tên" />
              </Form.Item>

              <Form.Item
                      name="phone"
                      label="Số điện thoại"
                      rules={[
                        { required: true, message: "Vui lòng nhập số điện thoại!" },
                        { pattern: /^[0-9]{10}$/, message: "Số điện thoại phải đủ 10 chữ số" },
                        { validator: (_, value) => value && value.trim() !== '' ? Promise.resolve() : Promise.reject('Số điện thoại không được để trống hoặc chỉ chứa khoảng trắng!') }
                      ]}
                    >
                      <Input placeholder="Nhập số điện thoại" />
                    </Form.Item>

                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: "Vui lòng nhập email!" },
                        { type: 'email', message: "Email không hợp lệ!" },
                        { validator: (_, value) => value && value.trim() !== '' ? Promise.resolve() : Promise.reject('Email không được để trống hoặc chỉ chứa khoảng trắng!') }
                      ]}
                    >
                      <Input placeholder="Nhập email" />
                    </Form.Item>

                    <AddressSelector
                      value={selectedAddressId}
                      onChange={setSelectedAddressId}
                      onAddressSelect={() => {}}
                      isGuest={true}
                      provinces={provinces}
                      districts={districts}
                      wards={wards}
                      selectedProvince={selectedProvince}
                      selectedDistrict={selectedDistrict}
                      selectedWard={selectedWard}
                      onProvinceChange={code => {
                        const province = provinces.find(p => p.code === code);
                        setSelectedProvince(province);
                      }}
                      onDistrictChange={code => {
                        const district = districts.find(d => d.code === code);
                        setSelectedDistrict(district);
                      }}
                      onWardChange={code => {
                    const ward = wards.find(w => w.code === code);
                    setSelectedWard(ward);
                  }}
                    />

              <Form.Item
                name="addressDetail"
                label="Địa chỉ chi tiết"
                rules={[
                  { required: true, message: "Nhập địa chỉ chi tiết!" },
                  { validator: (_, value) => value && value.trim() !== '' ? Promise.resolve() : Promise.reject('Địa chỉ không được để trống hoặc chỉ chứa khoảng trắng!') }
                ]}
              >
                <Input
                  placeholder="Số nhà, tên đường..."
                  value={addressDetail}
                  onChange={e => setAddressDetail(e.target.value)}
                />
              </Form.Item>

                    <div style={{ textAlign: 'right', marginTop: 16 }}>
                      <Button 
                        type="primary" 
                        onClick={() => {
                          // Lấy giá trị từ form
                          const formValues = form.getFieldsValue(['name', 'phone', 'email']);
                          if (selectedProvince && selectedDistrict && selectedWard && addressDetail && 
                              formValues.name && formValues.phone && formValues.email) {
                            setAddressModalVisible(false);
                          } else {
                            notification.warning({
                              message: 'Thông báo',
                              description: 'Vui lòng điền đầy đủ thông tin'
                            });
                          }
                        }}
                      >
                        Xác nhận
                      </Button>
                    </div>
                  </div>
                )}
              </Modal>

              {/* Voucher */}
              <Form.Item label="Mã giảm giá (Voucher)">
                <Button onClick={() => setVoucherModalOpen(true)} block>
                  {selectedVoucher ? `${selectedVoucher.code} - ${selectedVoucher.type === "percent" ? selectedVoucher.value + "%" : selectedVoucher.value.toLocaleString("vi-VN") + " VND"}` : "Chọn voucher"}
                </Button>
                {selectedVoucher && (
                  <div style={{ marginTop: 8, color: '#888', fontSize: 13 }}>
                    {/* <span>Đang áp dụng: </span> */}
                    {/* <Tag color={selectedVoucher.type === 'percent' ? 'blue' : 'green'}>{selectedVoucher.type?.toUpperCase()}</Tag> */}
                    {selectedVoucher.type === 'percent' && selectedVoucher.maxDiscountAmount > 0 && (
                      <span>Voucher - {selectedVoucher.maxDiscountAmount.toLocaleString('vi-VN')}đ</span>
                    )}
                    <Button size="small" style={{ marginLeft: 8 }} onClick={() => setSelectedVoucher(null)}>Bỏ chọn</Button>
                  </div>
                )}
              </Form.Item>

              {/* Modal chọn voucher */}
              <Modal
                open={voucherModalOpen}
                onCancel={() => setVoucherModalOpen(false)}
                title="Chọn voucher khả dụng"
                footer={null}
                width={600}
              >
                {vouchers.length === 0 ? (
                  <Empty description="Không có voucher khả dụng" />
                ) : (
                  vouchers.map((voucher) => {
                    const isValid = (!voucher.minOrderAmount || subtotal >= voucher.minOrderAmount) &&
                      (!voucher.usageLimit || !voucher.usedCount || voucher.usedCount < voucher.usageLimit);
                    return (
                      <Card
                        key={voucher._id || voucher.id}
                        style={{
                          marginBottom: 20,
                          border: selectedVoucher && selectedVoucher.code === voucher.code ? '2px solid #1890ff' : '1.5px solid #eee',
                          borderRadius: 14,
                          boxShadow: selectedVoucher && selectedVoucher.code === voucher.code ? '0 2px 12px #1890ff22' : '0 1px 6px #eee',
                          background: isValid ? '#fff' : '#fafafa',
                          transition: 'box-shadow 0.2s, border 0.2s',
                          cursor: isValid ? 'pointer' : 'not-allowed',
                        }}
                        bodyStyle={{ padding: 20 }}
                        hoverable
                        onClick={() => isValid && setSelectedVoucher(voucher)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                          <Tag color="blue" style={{ fontSize: 16, fontWeight: 700, padding: '2px 16px', marginRight: 12 }}>
                            {voucher.code}
                          </Tag>
                          <span style={{ fontWeight: 700, fontSize: 17 }}>{voucher.name || ''}</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#43a047', marginBottom: 4 }}>
                          Giảm: {voucher.type === 'percent' ? `${voucher.value}%` : `${voucher.value.toLocaleString()}đ`}
                        </div>
                        {voucher.type === 'percent' && voucher.maxDiscountAmount > 0 && (
                          <div style={{ color: '#bfa43a', fontSize: 15, marginBottom: 2 }}>Giảm tối đa: {voucher.maxDiscountAmount.toLocaleString()}đ</div>
                        )}
                        {voucher.minOrderAmount > 0 && (
                          <div style={{ color: '#bfa43a', fontSize: 15, marginBottom: 2 }}>Đơn từ: {voucher.minOrderAmount.toLocaleString('vi-VN')}đ</div>
                        )}
                        <div style={{ color: '#d9534f', fontSize: 15, marginBottom: 2 }}>{getDaysLeft(voucher.endDate)}</div>
                        {!isValid && <div style={{ color: '#ff4d4f', fontWeight: 600, marginTop: 4 }}>Không khả dụng cho đơn này</div>}
                        {selectedVoucher && selectedVoucher.code === voucher.code && <div style={{ color: '#1890ff', fontWeight: 600, marginTop: 4 }}>Đang chọn</div>}
                        <Button
                          type="primary"
                          style={{ marginTop: 12, fontWeight: 700, fontSize: 15, borderRadius: 8, width: '100%' }}
                          disabled={!isValid}
                          onClick={e => { e.stopPropagation(); setSelectedVoucher(voucher); setVoucherModalOpen(false); }}
                        >Chọn voucher này</Button>
                      </Card>
                    );
                  })
                )}
              </Modal>

              {/* Modal xem chi tiết voucher */}
              <Modal
                open={!!viewingVoucher}
                onCancel={() => setViewingVoucher(null)}
                title="Chi tiết voucher"
                footer={null}
                width={500}
              >
                {viewingVoucher && (
                  <div>
                    <div><b>Mã giảm giá:</b> {viewingVoucher.code}</div>
                    {/* <div><b>Type:</b> <Tag color={viewingVoucher.type === 'percent' ? 'blue' : 'green'}>{viewingVoucher.type?.toUpperCase()}</Tag></div> */}
                    <div><b>Giá trị:</b> {viewingVoucher.type === 'percent' ? `${viewingVoucher.value}%` : `${viewingVoucher.value?.toLocaleString('vi-VN')} VND`}</div>
                    <div><b>Đơn hàng bắt đầu từ:</b> {(viewingVoucher.minOrderAmount || 0).toLocaleString('vi-VN')} VND</div>
                    {/* <div><b>Total Order Amount:</b> {(viewingVoucher?.totalOrderAmount ?? 0).toLocaleString('vi-VN')} VND</div> */}
                    {/* Ẩn Usage Limit và Used Count */}
                    {/* {viewingVoucher.usageLimit !== undefined && <div><b>Usage Limit:</b> {viewingVoucher.usageLimit || 'Unlimited'}</div>} */}
                    {/* {viewingVoucher.usedCount !== undefined && <div><b>Used Count:</b> {viewingVoucher.usedCount}</div>} */}
                    {/* <div><b>Start Date:</b> {new Date(viewingVoucher.startDate).toLocaleDateString()}</div> */}
                    <div><b>Ngày hết hạn:</b> {new Date(viewingVoucher.endDate).toLocaleDateString()}</div>
                    <div><b>Khả dụng:</b> {viewingVoucher.isActive ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>}</div>
                    {/* Chỉ hiển thị Max Discount Amount nếu > 0 */}
                    {viewingVoucher.type === 'percent' && viewingVoucher.maxDiscountAmount > 0 && (
                      <div><b>Max Discount Amount:</b> {viewingVoucher.maxDiscountAmount.toLocaleString('vi-VN')} VND</div>
                    )}
                  </div>
                )}
              </Modal>

              {/* Payment */}
              <Form.Item
                name="paymentMethod"
                label="Phương thức thanh toán"
                rules={[{ required: true, message: "Vui lòng chọn phương thức!" }]}
              >
                <Select placeholder="Chọn phương thức">
                  <Option value="cash">Thanh toán khi nhận hàng</Option>
                  <Option value="bank">Chuyển khoản ngân hàng</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" loading={loading} block>
                  Đặt hàng ngay
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>

        {/* ================= SUMMARY ================= */}
        <div className="checkout-summary-section">
          <Card title="Đơn hàng của bạn" className="checkout-card">
            {/* Danh sách sản phẩm */}
            <div className="checkout-products-list">
              <div className="checkout-products-header" style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 100px', alignItems: 'center', fontWeight: 600, color: '#333', background: '#f8f9fa', borderRadius: 6, padding: '8px 0', marginBottom: 8 }}>
                <div style={{ textAlign: 'center' }}>Ảnh</div>
                <div style={{ textAlign: 'left' }}>Tên sản phẩm</div>
                <div style={{ textAlign: 'center' }}>Số lượng</div>
                <div style={{ textAlign: 'center' }}>Giá</div>
              </div>

              {itemsToCheckout.map((item, idx) => {
                const rawPrice = item.price || item.product?.price || 0;
                const discount = item.discount || item.product?.discount || 0;
                const finalPrice = discount > 0 ? rawPrice * (1 - discount / 100) : rawPrice;
                return (
                  <div key={idx} className="checkout-product-row" style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 100px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div className="checkout-product-image" style={{ textAlign: 'center' }}>
                      <img src={item.image || item.product?.image} alt={item.name || item.product?.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                    </div>
                    <div className="checkout-product-name" style={{ textAlign: 'left' }}>{item.name || item.product?.name}</div>
                    <div className="checkout-product-quantity" style={{ textAlign: 'center' }}>x{item.quantity}</div>
                    <div className="checkout-product-price" style={{ textAlign: 'center' }}>
                      {discount > 0 ? (
                        <>
                          <span className="original-price">{formatPrice(rawPrice)}</span>
                          <span className="discounted-price">{formatPrice(finalPrice)}</span>
                        </>
                      ) : (
                        <span className="current-price">{formatPrice(rawPrice)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Divider />

            <div className="order-summary">
              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {selectedVoucher && voucherDiscount > 0 && (
                <div className="summary-row">
                  <span>Voucher ({selectedVoucher.code}):</span>
                  <span>-{formatPrice(voucherDiscount)}</span>
                </div>
              )}

              {selectedVoucher && voucherDiscount === 0 && (
                <div className="summary-row">
                  <span>Voucher ({selectedVoucher.code}):</span>
                  <span style={{ color: '#ff4d4f' }}>Không áp dụng được</span>
                </div>
              )}

              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>Miễn phí</span>
              </div>

              <div className="summary-row total">
                <strong>Tổng cộng:</strong>
                <strong>{formatPrice(grandTotal)}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Custom Confirm Dialog */}
      {console.log('confirmDialog.show:', confirmDialog.show)}
      {confirmDialog.show && createPortal(
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h3>{confirmDialog.title}</h3>
            <p>{confirmDialog.message}</p>
            <div className="confirm-dialog-actions">
              <Button 
                onClick={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null })}
              >
                Hủy
              </Button>
              <Button 
                type="primary" 
                danger
                onClick={confirmDialog.onConfirm}
              >
                Đồng ý
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Checkout;
