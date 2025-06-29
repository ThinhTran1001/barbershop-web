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

// Gợi ý dịch vụ dựa trên loại tóc hoặc lịch sử đặt lịch
exports.suggestServices = async (req, res) => {
  try {
    const { hairType, userId } = req.query;
    let suggestions = [];
    if (hairType) {
      // Gợi ý dựa trên loại tóc
      suggestions = await Service.find({ suggestedFor: hairType });
    } else if (userId) {
      // Gợi ý dựa trên lịch sử đặt lịch
      const Booking = require("../models/booking.model");
      const bookings = await Booking.find({ customerId: userId }).select("serviceId");
      const bookedServiceIds = bookings.map(b => b.serviceId);
      // Gợi ý các dịch vụ chưa từng đặt
      suggestions = await Service.find({ _id: { $nin: bookedServiceIds } });
    } else {
      // Nếu không có thông tin, trả về tất cả dịch vụ
      suggestions = await Service.find();
    }
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
