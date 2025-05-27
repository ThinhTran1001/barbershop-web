const Barber = require('../models/barber.model');

exports.createBarber = async (req, res) => {
  try {
    const userId = req.user.id;

    const existingBarber = await Barber.findOne({ userId });
    if (existingBarber) {
      return res.status(400).json({ message: 'User đã có hồ sơ barber.' });
    }

    const newBarber = new Barber({
      userId,
      bio: req.body.bio,
      experienceYears: req.body.experienceYears,
      specialties: req.body.specialties,
      workingSince: req.body.workingSince,
    });

    const savedBarber = await newBarber.save();
    res.status(201).json(savedBarber);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllBarbers = async (req, res) => {
  try {
    const barbers = await Barber.find().populate('userId', 'name email');
    res.json(barbers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBarberById = async (req, res) => {
  try {
    const barber = await Barber.findById(req.params.id).populate('userId', 'name email');
    if (!barber) return res.status(404).json({ message: 'Không tìm thấy barber' });
    res.json(barber);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBarber = async (req, res) => {
  try {
    const userId = req.user.id;

    const barber = await Barber.findOne({ userId });
    if (!barber) return res.status(404).json({ message: 'Không tìm thấy hồ sơ barber' });

    barber.bio = req.body.bio || barber.bio;
    barber.experienceYears = req.body.experienceYears || barber.experienceYears;
    barber.specialties = req.body.specialties || barber.specialties;
    barber.workingSince = req.body.workingSince || barber.workingSince;
    barber.isAvailable = req.body.isAvailable ?? barber.isAvailable;

    const updated = await barber.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteBarber = async (req, res) => {
  try {
    const userId = req.user.id;

    const deleted = await Barber.findOneAndDelete({ userId });
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy hồ sơ barber' });

    res.json({ message: 'Đã xoá hồ sơ barber thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
