# Stock Validation Feature - Documentation

## 🎯 **Mục tiêu**
Thêm thông báo khi user nhập quá số lượng sản phẩm có trong kho để ngăn chặn việc đặt hàng vượt quá stock. **KHÔNG tự động điều chỉnh số lượng về max stock**, mà hiển thị thông báo lỗi rõ ràng.

## ✅ **Các thay đổi đã thực hiện**

### **1. Backend - Cart Controller**

#### **File: `back-end/controllers/cart.controller.js`**

**Thêm import:**
```javascript
const Product = require('../models/product.model');
```

**Cập nhật function `addItem`:**
- ✅ Kiểm tra sản phẩm có tồn tại và active không
- ✅ Kiểm tra số lượng trong giỏ hàng hiện tại
- ✅ Kiểm tra tổng số lượng (hiện tại + mới) có vượt quá stock không
- ✅ Trả về thông báo lỗi chi tiết nếu vượt quá stock

**Cập nhật function `updateItem`:**
- ✅ Kiểm tra sản phẩm có tồn tại và active không
- ✅ Kiểm tra số lượng mới có vượt quá stock không
- ✅ Trả về thông báo lỗi chi tiết nếu vượt quá stock

#### **Thông báo lỗi:**
```javascript
// Khi vượt quá stock
{
  message: "Số lượng trong kho không đủ. Hiện tại chỉ còn {stock} sản phẩm trong kho.",
  availableStock: stock,
  requestedQuantity: totalQuantity
}

// Khi sản phẩm không khả dụng
{
  message: "Sản phẩm hiện không khả dụng"
}
```

### **2. Frontend - ProductDetail**

#### **File: `front-end/src/components/product/ProductDetail.jsx`**

**Cập nhật InputNumber component:**
- ✅ **Bỏ logic auto-fill trong onChange**
- ✅ **Bỏ max prop để tránh auto-adjust**
- ✅ Thêm `precision={0}` và `step={1}` để tối ưu input
- ✅ Giữ nguyên giá trị user nhập thay vì tự động điều chỉnh

**Cập nhật validation logic:**
- ✅ Kiểm tra tổng số lượng có vượt quá stock không
- ✅ Hiển thị thông báo lỗi nếu vượt quá stock
- ✅ **KHÔNG tự động điều chỉnh số lượng**

### **3. Frontend - UserCartContext**

#### **File: `front-end/src/context/UserCartContext.jsx`**

**Thêm import:**
```javascript
import ToastService from '../services/toastService';
```

**Cập nhật function `addToCart`:**
- ✅ Hiển thị thông báo khi đạt giới hạn stock trong giỏ hàng
- ✅ Xử lý lỗi từ backend và hiển thị thông báo phù hợp
- ✅ Sử dụng ToastService để hiển thị thông báo đẹp

**Cập nhật function `updateQuantity`:**
- ✅ Xử lý lỗi từ backend khi cập nhật số lượng
- ✅ Hiển thị thông báo phù hợp cho từng loại lỗi

### **4. Frontend - Cart Components**

#### **File: `front-end/src/components/cart/UserCart.jsx` & `Cart.jsx`**

**Cập nhật InputNumber onChange:**
- ✅ **Bỏ logic auto-fill khi vượt quá stock**
- ✅ **Thay thế bằng thông báo lỗi**
- ✅ Giữ nguyên giá trị user nhập thay vì tự động điều chỉnh
- ✅ Hiển thị notification warning thay vì info

### **5. Frontend - ToastService**

#### **File: `front-end/src/services/toastService.jsx`**

**Các function có sẵn:**
- ✅ `showCartLimitReached()`: Thông báo khi đạt giới hạn trong giỏ hàng
- ✅ `showQuantityLimitExceeded()`: Thông báo khi vượt quá số lượng cho phép
- ✅ `showWarning()`: Thông báo cảnh báo chung

## 🎯 **Luồng hoạt động**

### **Khi thêm sản phẩm vào giỏ hàng:**

1. **Frontend kiểm tra trước:**
   - Kiểm tra số lượng hiện tại trong giỏ hàng
   - Kiểm tra tổng số lượng (giỏ hàng + mới) có vượt quá stock không
   - **Hiển thị thông báo lỗi nếu vượt quá stock (KHÔNG tự động điều chỉnh)**

2. **Backend kiểm tra:**
   - Kiểm tra sản phẩm có tồn tại và active không
   - Kiểm tra tổng số lượng (giỏ hàng + mới) có vượt quá stock không
   - Trả về lỗi nếu vượt quá stock

3. **Frontend xử lý lỗi:**
   - Bắt lỗi từ backend
   - Hiển thị thông báo phù hợp
   - Revert state nếu cần

### **Khi cập nhật số lượng:**

1. **Frontend kiểm tra:**
   - Kiểm tra số lượng mới có vượt quá stock không
   - **Hiển thị thông báo lỗi nếu vượt quá (KHÔNG tự động điều chỉnh)**

2. **Backend kiểm tra:**
   - Kiểm tra sản phẩm có tồn tại và active không
   - Kiểm tra số lượng mới có vượt quá stock không
   - Trả về lỗi nếu vượt quá stock

3. **Frontend xử lý lỗi:**
   - Bắt lỗi từ backend
   - Hiển thị thông báo phù hợp

## 📋 **Các thông báo**

### **Thông báo thành công:**
- ✅ "Sản phẩm đã được thêm vào giỏ hàng"
- ✅ "Cập nhật số lượng thành công"

### **Thông báo cảnh báo:**
- ⚠️ "Số lượng trong kho không đủ. Hiện tại chỉ còn X sản phẩm trong kho."
- ⚠️ "Sản phẩm hiện không khả dụng"
- ⚠️ "Sản phẩm đã đạt số lượng tối đa trong giỏ hàng"

### **Thông báo lỗi:**
- ❌ "Thêm vào giỏ hàng thất bại"
- ❌ "Cập nhật số lượng thất bại"

## 🧪 **Test Cases**

### **Test 1: Thêm sản phẩm với stock = 64 (như trong ảnh)**
- ✅ Thêm 50 sản phẩm → Thành công
- ✅ Thêm 64 sản phẩm → Thành công
- ❌ Thêm 100 sản phẩm → Thất bại, hiển thị thông báo "Số lượng trong kho không đủ"
- ❌ Thêm 200 sản phẩm → Thất bại, hiển thị thông báo "Số lượng trong kho không đủ"

### **Test 2: Cập nhật số lượng**
- ✅ Cập nhật từ 30 lên 60 → Thành công
- ✅ Cập nhật từ 30 lên 64 → Thành công
- ❌ Cập nhật từ 30 lên 65 → Thất bại, hiển thị thông báo "Số lượng trong kho không đủ"

### **Test 3: Sản phẩm không khả dụng**
- ❌ Thêm sản phẩm inactive → Thất bại, hiển thị thông báo

## 🚀 **Deployment**

1. **Backend**: Deploy các thay đổi trong `cart.controller.js`
2. **Frontend**: Deploy các thay đổi trong `UserCartContext.jsx`
3. **Test**: Kiểm tra các trường hợp thêm/cập nhật sản phẩm

## ✅ **Kết quả**

- ✅ **Ngăn chặn đặt hàng vượt quá stock**
- ✅ **Thông báo rõ ràng cho user**
- ✅ **KHÔNG tự động điều chỉnh số lượng về max stock**
- ✅ **UX tốt với toast notifications**
- ✅ **Validation ở cả frontend và backend**
- ✅ **Xử lý lỗi graceful**

**Tính năng đã hoàn thành và sẵn sàng sử dụng!** 🎉

## 🎯 **Ví dụ thực tế**

**Kịch bản:** Sản phẩm "Dầu gội L'Oréal Men Expert" có stock = 64
- User nhập số lượng = 100
- User click "Thêm vào giỏ hàng"
- **Kết quả:** Hiển thị thông báo "Số lượng trong kho không đủ. Hiện tại chỉ còn 64 sản phẩm trong kho."
- **KHÔNG tự động điều chỉnh về 64** 