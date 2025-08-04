# Address Optimization Logic

## Tổng quan
Logic tối ưu hóa địa chỉ được thiết kế để giảm thiểu số lượng records trong database bằng cách tái sử dụng các địa chỉ đã bị soft delete.

## Logic hoạt động

### 1. Khi tạo địa chỉ mới

#### Bước 1: Kiểm tra địa chỉ active giống hệt
- Tìm địa chỉ active có tất cả thông tin giống hệt (tên, SĐT, tỉnh, huyện, xã, đường)
- Nếu tìm thấy → Trả về lỗi "Địa chỉ này đã tồn tại"

#### Bước 2: Tìm và restore địa chỉ đã soft delete
- **Exact Match**: Tìm địa chỉ đã soft delete có tất cả thông tin giống hệt
  - Nếu tìm thấy → Restore và trả về
- **Province/District Match**: Nếu không có exact match, tìm địa chỉ có cùng tỉnh/huyện
  - Nếu tìm thấy → Cập nhật thông tin mới (tên, SĐT, xã, đường) và restore
  - Mục đích: Tối ưu DB bằng cách tái sử dụng record cũ

#### Bước 3: Tạo địa chỉ mới
- Nếu không tìm thấy địa chỉ nào để restore → Tạo record mới

### 2. Soft Delete Logic

#### Khi xóa địa chỉ
- Set `isDeleted: true`
- Set `deletedAt: current timestamp`
- **Không cho phép xóa địa chỉ mặc định** → Yêu cầu user set địa chỉ khác làm mặc định trước

#### Cleanup Job
- Chạy định kỳ để xóa vĩnh viễn các địa chỉ đã soft delete quá 30 ngày
- Kiểm tra xem có đơn hàng active nào đang sử dụng địa chỉ không
- Chỉ xóa nếu không có đơn hàng pending/processing/shipped

## Ví dụ thực tế

### Scenario 1: Exact Match
```
User xóa địa chỉ: "Nguyễn Văn A - 0123456789 - Hà Nội, Ba Đình, Phúc Xá"
Sau đó tạo lại địa chỉ giống hệt
→ Restore địa chỉ cũ, không tạo record mới
```

### Scenario 2: Province/District Match
```
User xóa địa chỉ: "Nguyễn Văn A - 0123456789 - Hà Nội, Ba Đình, Phúc Xá"
Sau đó tạo địa chỉ: "Trần Thị B - 0987654321 - Hà Nội, Ba Đình, Liễu Giai"
→ Cập nhật thông tin mới vào record cũ, giữ nguyên tỉnh/huyện
```

### Scenario 3: Khác tỉnh/huyện
```
User xóa địa chỉ: "Nguyễn Văn A - 0123456789 - Hà Nội, Ba Đình, Phúc Xá"
Sau đó tạo địa chỉ: "Trần Thị B - 0987654321 - TP.HCM, Quận 1, Bến Nghé"
→ Tạo record mới vì khác tỉnh/huyện
```

## Lợi ích

1. **Giảm số lượng records**: Tái sử dụng records đã soft delete
2. **Tối ưu performance**: Ít records hơn = query nhanh hơn
3. **Tiết kiệm storage**: Giảm dung lượng database
4. **Bảo toàn dữ liệu**: Vẫn có thể restore nếu cần

## Commands

### Chạy cleanup job thủ công
```bash
npm run cleanup-addresses
```

### Chạy cleanup job định kỳ (cron job)
```bash
# Chạy mỗi ngày lúc 2:00 AM
0 2 * * * cd /path/to/back-end && npm run cleanup-addresses
```

## Database Indexes

Các indexes được tạo để tối ưu performance:
- `{ userId: 1, isDefault: 1 }`
- `{ userId: 1, isActive: 1 }`
- `{ userId: 1, isDeleted: 1 }`
- `{ isDeleted: 1, deletedAt: 1 }`
- `{ userId: 1, recipientName: 1, phone: 1, province: 1, district: 1, ward: 1, street: 1 }` 