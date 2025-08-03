const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  province: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  ward: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

addressSchema.index({ userId: 1, isDefault: 1 });
addressSchema.index({ userId: 1, isActive: 1 });
addressSchema.index({ userId: 1, isDeleted: 1 });
addressSchema.index({ isDeleted: 1, deletedAt: 1 });
// Index để kiểm tra duplicate
addressSchema.index({ 
  userId: 1, 
  recipientName: 1, 
  phone: 1, 
  province: 1, 
  district: 1, 
  ward: 1, 
  street: 1 
});

addressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

addressSchema.statics.findOrRestore = async function(addressData) {
  const { userId, recipientName, phone, province, district, ward, street } = addressData;
  
  console.log('🔍 findOrRestore called with:', { userId, province, district, ward });
  
  // Tìm địa chỉ đã soft delete có thông tin giống hệt (tất cả trường)
  const exactMatchAddress = await this.findOne({
    userId,
    recipientName,
    phone,
    province,
    district,
    ward,
    street,
    isDeleted: true
  });

  if (exactMatchAddress) {
    console.log('✅ Found exact match address:', exactMatchAddress._id);
    exactMatchAddress.isDeleted = false;
    exactMatchAddress.deletedAt = null;
    await exactMatchAddress.save();
    return exactMatchAddress;
  }

  console.log('❌ No exact match found, checking for province match...');

  // Nếu không tìm thấy exact match, tìm địa chỉ có cùng tỉnh/thành phố để tối ưu DB
  const provinceMatchAddress = await this.findOne({
    userId,
    province,
    isDeleted: true
  });

  if (provinceMatchAddress) {
    console.log('✅ Found province match address:', provinceMatchAddress._id);
    console.log('📝 Updating with new data:', { recipientName, phone, district, ward, street });
    
    // Cập nhật thông tin mới nhưng giữ nguyên tỉnh/thành phố
    provinceMatchAddress.recipientName = recipientName;
    provinceMatchAddress.phone = phone;
    provinceMatchAddress.district = district;
    provinceMatchAddress.ward = ward;
    provinceMatchAddress.street = street;
    provinceMatchAddress.isDeleted = false;
    provinceMatchAddress.deletedAt = null;
    await provinceMatchAddress.save();
    return provinceMatchAddress;
  }

  console.log('❌ No province match found either');
  return null;
};

// Static method để cleanup địa chỉ đã soft delete sau 30 ngày
addressSchema.statics.cleanupDeletedAddresses = async function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  try {
    // Tìm địa chỉ đã soft delete quá 30 ngày
    const addressesToDelete = await this.find({
      isDeleted: true,
      deletedAt: { $lt: thirtyDaysAgo }
    });

    let deletedCount = 0;
    
    for (const address of addressesToDelete) {
      // Kiểm tra xem có đơn hàng nào đang sử dụng địa chỉ này không
      const mongoose = require('mongoose');
      const Order = mongoose.model('Order');
      
      const hasActiveOrders = await Order.exists({
        addressId: address._id,
        status: { $in: ['pending', 'processing', 'shipped'] }
      });

      // Chỉ xóa nếu không có đơn hàng active
      if (!hasActiveOrders) {
        await this.findByIdAndDelete(address._id);
        deletedCount++;
      }
    }

    console.log(`Cleaned up ${deletedCount} deleted addresses older than 30 days`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up deleted addresses:', error);
    throw error;
  }
};

// Static method để soft delete địa chỉ
addressSchema.statics.softDelete = async function(addressId) {
  try {
    const address = await this.findById(addressId);
    if (!address) {
      throw new Error('Address not found');
    }

    // Soft delete
    address.isDeleted = true;
    address.deletedAt = new Date();
    await address.save();

    return address;
  } catch (error) {
    console.error('Error soft deleting address:', error);
    throw error;
  }
};

// Static method để restore địa chỉ đã soft delete
addressSchema.statics.restore = async function(addressId) {
  try {
    const address = await this.findById(addressId);
    if (!address) {
      throw new Error('Address not found');
    }

    if (!address.isDeleted) {
      throw new Error('Address is not deleted');
    }

    // Restore
    address.isDeleted = false;
    address.deletedAt = null;
    await address.save();

    return address;
  } catch (error) {
    console.error('Error restoring address:', error);
    throw error;
  }
};

module.exports = mongoose.model('Address', addressSchema); 