const Service = require("../models/service.model");

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const newService = new Service(req.body);
    await newService.save();
    res.status(201).json(newService);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const handleDelete = async (id) => {
  try {
    // Lấy dịch vụ hiện tại để xác định trạng thái isActive
    const currentService = services.find((service) => service._id === id);
    // Cập nhật trạng thái isActive (đảo ngược: true -> false hoặc false -> true)
    await updateService(id, { isActive: !currentService.isActive });
    notification.success({
      message: "Success",
      description: `Service ${currentService.isActive ? "deactivated" : "activated"} successfully`,
      placement: "topRight",
    });
    fetchServices();
  } catch {
    notification.error({
      message: "Error",
      description: "Failed to update service status",
      placement: "topRight",
    });
  }
};