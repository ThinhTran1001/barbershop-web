# Voucher Validation System

## Tổng quan
Hệ thống đã được cập nhật để đảm bảo rằng chỉ người dùng sở hữu voucher mới có thể sử dụng nó trong quá trình tạo đơn hàng.

## Các thay đổi chính

### 1. Helper Function: `validateVoucherUsage`
- **Vị trí**: `barbershop-web/back-end/controllers/order.controller.js`
- **Chức năng**: Kiểm tra toàn diện quyền sử dụng voucher của người dùng

#### Các bước kiểm tra:
1. **Voucher tồn tại và active**: Kiểm tra voucher có tồn tại và đang hoạt động
2. **Thời gian hiệu lực**: Kiểm tra voucher có trong thời gian hiệu lực không
3. **Giới hạn sử dụng**: Kiểm tra voucher chưa đạt giới hạn sử dụng
4. **Quyền sở hữu**: Kiểm tra người dùng có voucher trong bảng `User_Voucher` và chưa sử dụng

### 2. Cập nhật hàm `createOrder`
- **Validation mới**: Thêm kiểm tra quyền sở hữu voucher trước khi cho phép sử dụng
- **Thông báo lỗi**: "Voucher không khả dụng cho tài khoản này" khi người dùng không có quyền

### 3. Logic xử lý voucher
- **Khi tạo đơn hàng**: 
  - Tăng `usedCount` của voucher gốc
  - Đánh dấu `isUsed = true` trong `User_Voucher`
  - Vô hiệu hóa voucher gốc nếu đạt giới hạn

- **Khi hủy đơn hàng**:
  - Giảm `usedCount` của voucher gốc
  - Đánh dấu lại `isUsed = false` trong `User_Voucher`
  - Kích hoạt lại voucher gốc

## Cấu trúc Database

### Bảng `Voucher`
```javascript
{
  code: String,           // Mã voucher
  type: String,           // 'percent' hoặc 'fixed'
  value: Number,          // Giá trị voucher
  usageLimit: Number,     // Giới hạn sử dụng
  usedCount: Number,      // Số lần đã sử dụng
  minOrderAmount: Number, // Giá trị đơn hàng tối thiểu
  startDate: Date,        // Ngày bắt đầu hiệu lực
  endDate: Date,          // Ngày kết thúc hiệu lực
  isActive: Boolean       // Trạng thái hoạt động
}
```

### Bảng `User_Voucher`
```javascript
{
  userId: ObjectId,       // ID người dùng
  voucherId: ObjectId,    // ID voucher
  isUsed: Boolean,        // Đã sử dụng chưa
  assignedAt: Date        // Ngày được gán
}
```

## Luồng xử lý

### 1. Tạo đơn hàng với voucher
```
1. Người dùng gửi request tạo đơn hàng với voucherId
2. Hệ thống gọi validateVoucherUsage(userId, voucherId)
3. Kiểm tra các điều kiện:
   - Voucher tồn tại và active
   - Trong thời gian hiệu lực
   - Chưa đạt giới hạn sử dụng
   - Người dùng có quyền sử dụng (có record trong User_Voucher)
4. Nếu tất cả điều kiện đều pass → tạo đơn hàng
5. Cập nhật trạng thái voucher và user_voucher
```

### 2. Hủy đơn hàng
```
1. Người dùng hủy đơn hàng
2. Hệ thống kiểm tra quyền (chỉ chủ đơn mới được hủy)
3. Hoàn lại voucher:
   - Giảm usedCount của voucher gốc
   - Đánh dấu isUsed = false trong User_Voucher
   - Kích hoạt lại voucher gốc nếu cần
4. Trả lại stock sản phẩm
```

## Thông báo lỗi

| Trường hợp | Thông báo |
|------------|-----------|
| Voucher không tồn tại hoặc không active | "Voucher không hợp lệ hoặc đã hết hạn" |
| Voucher chưa đến thời gian hiệu lực | "Voucher chưa được áp dụng" |
| Voucher đã hết hạn | "Voucher đã hết hạn" |
| Voucher đã đạt giới hạn sử dụng | "Voucher đã được sử dụng hết" |
| Người dùng không có quyền sử dụng | "Voucher không khả dụng cho tài khoản này" |
| Đơn hàng không đạt giá trị tối thiểu | "Đơn hàng cần tối thiểu {amount} để áp dụng voucher" |

## Bảo mật

- **Authentication**: Tất cả request đều yêu cầu token hợp lệ
- **Authorization**: Chỉ chủ đơn hàng mới có thể hủy đơn
- **Data Integrity**: Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
- **Validation**: Kiểm tra toàn diện trước khi cho phép sử dụng voucher

## Testing

Để test hệ thống, có thể tạo các scenario sau:

1. **Người dùng A sử dụng voucher của người dùng B** → Phải trả về lỗi "Voucher không khả dụng"
2. **Sử dụng voucher đã hết hạn** → Phải trả về lỗi "Voucher đã hết hạn"
3. **Sử dụng voucher chưa đến thời gian hiệu lực** → Phải trả về lỗi "Voucher chưa được áp dụng"
4. **Sử dụng voucher đã đạt giới hạn** → Phải trả về lỗi "Voucher đã được sử dụng hết"
5. **Hủy đơn hàng** → Phải hoàn lại voucher cho người dùng 