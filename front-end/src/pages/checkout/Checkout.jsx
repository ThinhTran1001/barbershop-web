import React, { useState, useEffect, useMemo } from "react";
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
} from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserCart } from "../../context/UserCartContext";
import {
  createOrder,
  getVoucherByUser,
  getProfile,
} from "../../services/api";
import "../../css/checkout/checkout.css";
import { useAuth } from "../../context/AuthContext";

const { TextArea } = Input;
const { Option } = Select;

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
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [addressDetail, setAddressDetail] = useState("");

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

      const orderData = {
        customerName: values.name,
        customerEmail: values.email,
        customerPhone: values.phone,
        // Khi submit, đảm bảo shippingAddress luôn theo thứ tự đầy đủ:
        // Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố
        shippingAddress: `${addressDetail}, ${selectedWard?.name}, ${selectedDistrict?.name}, ${selectedProvince?.name}`,
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

  // Luôn fetch lại cart khi vào trang checkout để đảm bảo lấy số lượng mới nhất
  useEffect(() => {
    fetchCart();
  }, []);

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
              {/* Họ tên */}
              <Form.Item
                name="name"
                label="Họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>

              {/* Điện thoại */}
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại!" },
                  { pattern: /^[0-9]{10}$/, message: "Số điện thoại phải đủ 10 chữ số" },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>

              {/* Email */}
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>

              {/* Địa chỉ */}
              <Form.Item
                name="province"
                label="Tỉnh/Thành phố"
                rules={[{ required: true, message: "Chọn tỉnh/thành phố!" }]}
              >
                <Select
                  placeholder="Chọn tỉnh/thành phố"
                  onChange={code => {
                    const province = provinces.find(p => p.code === code);
                    setSelectedProvince(province);
                  }}
                  value={selectedProvince?.code}
                  showSearch
                  optionFilterProp="children"
                >
                  {provinces.map(p => <Option key={p.code} value={p.code}>{p.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item
                name="district"
                label="Quận/Huyện"
                rules={[{ required: true, message: "Chọn quận/huyện!" }]}
              >
                <Select
                  placeholder="Chọn quận/huyện"
                  onChange={code => {
                    const district = districts.find(d => d.code === code);
                    setSelectedDistrict(district);
                  }}
                  value={selectedDistrict?.code}
                  disabled={!selectedProvince}
                  showSearch
                  optionFilterProp="children"
                >
                  {districts.map(d => <Option key={d.code} value={d.code}>{d.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item
                name="ward"
                label="Phường/Xã"
                rules={[{ required: true, message: "Chọn phường/xã!" }]}
              >
                <Select
                  placeholder="Chọn phường/xã"
                  onChange={code => {
                    const ward = wards.find(w => w.code === code);
                    setSelectedWard(ward);
                  }}
                  value={selectedWard?.code}
                  disabled={!selectedDistrict}
                  showSearch
                  optionFilterProp="children"
                >
                  {wards.map(w => <Option key={w.code} value={w.code}>{w.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item
                name="addressDetail"
                label="Địa chỉ chi tiết"
                rules={[{ required: true, message: "Nhập địa chỉ chi tiết!" }]}
              >
                <Input
                  placeholder="Số nhà, tên đường..."
                  value={addressDetail}
                  onChange={e => setAddressDetail(e.target.value)}
                />
              </Form.Item>

              {/* Voucher */}
              <Form.Item label="Mã giảm giá (Voucher)">
                <Button onClick={() => setVoucherModalOpen(true)} block>
                  {selectedVoucher ? `${selectedVoucher.code} - ${selectedVoucher.type === "percent" ? selectedVoucher.value + "%" : selectedVoucher.value.toLocaleString("vi-VN") + " VND"}` : "Chọn voucher"}
                </Button>
                {selectedVoucher && (
                  <div style={{ marginTop: 8, color: '#888', fontSize: 13 }}>
                    <span>Đang áp dụng: </span>
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
    </div>
  );
};

export default Checkout;
