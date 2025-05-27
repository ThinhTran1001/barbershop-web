const Service = require("../models/service.model");

// Lấy tất cả dịch vụ
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo dịch vụ mới
exports.createService = async (req, res) => {
  try {
    const newService = new Service(req.body);
    await newService.save();
    res.status(201).json(newService);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cập nhật dịch vụ
exports.updateService = async (req, res) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // Trả về bản ghi đã cập nhật
    );

    if (!updatedService) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(updatedService);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa (hoặc vô hiệu hóa) dịch vụ
exports.deleteService = async (req, res) => {
  try {
    const deletedService = await Service.findByIdAndDelete(req.params.id);

    if (!deletedService) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
