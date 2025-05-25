const Barber = require("../models/barber.model");


exports.getAllBarbers = async (req, res) => {
  try {
    const barbers = await Barber.find();
    res.status(200).json(barbers);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách barber", error: err.message });
  }
};


exports.createBarber = async (req, res) => {
  try {
    const barber = new Barber(req.body);
    await barber.save();
    res.status(201).json(barber);
  } catch (err) {
    res.status(400).json({ message: "Không thể tạo barber", error: err.message });
  }
};


exports.getBarberById = async (req, res) => {
  try {
    const barber = await Barber.findById(req.params.id);
    if (!barber) return res.status(404).json({ message: "Barber không tồn tại" });
    res.json(barber);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy barber", error: err.message });
  }
};


exports.updateBarber = async (req, res) => {
  try {
    const barber = await Barber.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!barber) return res.status(404).json({ message: "Barber không tồn tại" });
    res.json(barber);
  } catch (err) {
    res.status(400).json({ message: "Không thể cập nhật barber", error: err.message });
  }
};


exports.deleteBarber = async (req, res) => {
  try {
    const barber = await Barber.findByIdAndDelete(req.params.id);
    if (!barber) return res.status(404).json({ message: "Barber không tồn tại" });
    res.json({ message: "Đã xoá barber thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xoá barber", error: err.message });
  }
};
