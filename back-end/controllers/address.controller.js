const Address = require('../models/address.model');
const User = require('../models/user.model');

// Lấy tất cả địa chỉ của user
exports.getUserAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ 
      userId: req.user.id, 
      isActive: true 
    }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: addresses
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Lấy địa chỉ mặc định của user
exports.getDefaultAddress = async (req, res) => {
  try {
    const defaultAddress = await Address.findOne({ 
      userId: req.user.id, 
      isDefault: true,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: defaultAddress
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Tạo địa chỉ mới
exports.createAddress = async (req, res) => {
  try {
    const addressData = {
      ...req.body,
      userId: req.user.id
    };

    // Kiểm tra xem có địa chỉ active nào giống hệt không
    const existingActiveAddress = await Address.findOne({
      userId: req.user.id,
      recipientName: addressData.recipientName,
      phone: addressData.phone,
      province: addressData.province,
      district: addressData.district,
      ward: addressData.ward,
      street: addressData.street,
      isActive: true
    });

    if (existingActiveAddress) {
      return res.status(400).json({
        success: false,
        message: 'Địa chỉ này đã tồn tại'
      });
    }

    // Kiểm tra và khôi phục địa chỉ đã soft delete
    const restoredAddress = await Address.findOrRestore(addressData);
    
    if (restoredAddress) {
      // Nếu khôi phục và được set làm mặc định
      if (req.body.isDefault) {
        await Address.updateMany(
          { userId: req.user.id, _id: { $ne: restoredAddress._id } },
          { isDefault: false }
        );
        restoredAddress.isDefault = true;
        await restoredAddress.save();
        
        // Cập nhật defaultAddressId trong User
        await User.findByIdAndUpdate(req.user.id, {
          defaultAddressId: restoredAddress._id
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Địa chỉ đã được khôi phục thành công',
        data: restoredAddress
      });
    }

    // Nếu đây là địa chỉ đầu tiên hoặc được set làm mặc định
    if (req.body.isDefault) {
      // Set tất cả địa chỉ khác thành false
      await Address.updateMany(
        { userId: req.user.id },
        { isDefault: false }
      );
    }

    const newAddress = new Address(addressData);
    const savedAddress = await newAddress.save();

    // Cập nhật defaultAddressId trong User nếu đây là địa chỉ mặc định
    if (savedAddress.isDefault) {
      await User.findByIdAndUpdate(req.user.id, {
        defaultAddressId: savedAddress._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Địa chỉ đã được tạo thành công',
      data: savedAddress
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Cập nhật địa chỉ
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra địa chỉ có thuộc về user không
    const existingAddress = await Address.findOne({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }

    const updateData = req.body;

    // Nếu set làm mặc định, cần cập nhật các địa chỉ khác
    if (updateData.isDefault) {
      await Address.updateMany(
        { userId: req.user.id, _id: { $ne: id } },
        { isDefault: false }
      );
      
      // Cập nhật defaultAddressId trong User
      await User.findByIdAndUpdate(req.user.id, {
        defaultAddressId: id
      });
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Địa chỉ đã được cập nhật thành công',
      data: updatedAddress
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Xóa địa chỉ (soft delete)
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra địa chỉ có thuộc về user không
    const existingAddress = await Address.findOne({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }

    // Nếu đây là địa chỉ mặc định, cần set địa chỉ khác làm mặc định
    if (existingAddress.isDefault) {
      const otherAddress = await Address.findOne({
        userId: req.user.id,
        _id: { $ne: id },
        isActive: true
      });

      if (otherAddress) {
        otherAddress.isDefault = true;
        await otherAddress.save();
        
        // Cập nhật defaultAddressId trong User
        await User.findByIdAndUpdate(req.user.id, {
          defaultAddressId: otherAddress._id
        });
      } else {
        // Không còn địa chỉ nào, xóa defaultAddressId
        await User.findByIdAndUpdate(req.user.id, {
          defaultAddressId: null
        });
      }
    }

    // Soft delete
    await Address.findByIdAndUpdate(id, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Địa chỉ đã được xóa thành công'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Set địa chỉ làm mặc định
exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra địa chỉ có thuộc về user không
    const existingAddress = await Address.findOne({ 
      _id: id, 
      userId: req.user.id,
      isActive: true
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }

    // Set tất cả địa chỉ khác thành false
    await Address.updateMany(
      { userId: req.user.id, _id: { $ne: id } },
      { isDefault: false }
    );

    // Set địa chỉ này làm mặc định
    existingAddress.isDefault = true;
    await existingAddress.save();

    // Cập nhật defaultAddressId trong User
    await User.findByIdAndUpdate(req.user.id, {
      defaultAddressId: id
    });

    res.status(200).json({
      success: true,
      message: 'Đã set địa chỉ làm mặc định thành công',
      data: existingAddress
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}; 