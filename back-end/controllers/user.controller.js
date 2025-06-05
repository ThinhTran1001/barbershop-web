const User = require('../models/user.model')
const cloudinary = require('../config/cloudinary');
const bcrypt = require('bcrypt');


exports.createUser = async (req, res) => {
  try {

    const newUser = new User(req.body)
    const password = await bcrypt.hash(req.body.passwordHash, 10)
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
 