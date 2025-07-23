const User = require('../models/user.model')
const cloudinary = require('../config/cloudinary');
 const Barber = require('../models/barber.model');
const bcrypt = require('bcrypt');


exports.createUser = async (req, res) => {
  try {
    const newUser = new User(req.body)
    const password = await bcrypt.hash(req.body.passwordHash, 10)
    newUser.passwordHash = password;
    const saveUser = await newUser.save()

    res.status(201).json(saveUser);

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getAllUser = async (req, res) => {
  try {
    const allUser = await User.find();
    res.status(200).json(allUser)
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.getSingleUser = async (req, res) => {
  try {
    const oneUser = await User.findById(req.params.id);
    if (!oneUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      data: oneUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Update successful',
      data: user,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    if (user.role === 'barber') {
     
      const barber = await Barber.findOne({ userId: user._id }).populate('userId', 'name email phone avatarUrl');
      if (!barber) {
        return res.status(404).json({
          success: false,
          message: 'Barber profile not found'
        });
      }
      return res.status(200).json({
        success: true,
        data: barber
      });
    }
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address, avatarUrl } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (avatarUrl) updateData.avatarUrl = avatarUrl


    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'user_profiles',
        width: 300,
        crop: "scale"
      });
      updateData.profileImage = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
