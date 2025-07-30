const Service = require("../models/service.model");

// Utility function to validate URLs
const isValidUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  // Block placeholder-like URLs and invalid formats
  if (
    url.includes("placeholder.com") ||
    url.includes("example.com") ||
    url.startsWith("blob:") ||
    url.includes("undefined") ||
    url.match(/\/$/) ||
    url.match(/^data:/) ||
    url.endsWith(".svg") // Adjust based on your requirements
  ) return false;
  try {
    new URL(url); // Ensures URL is well-formed
    return true;
  } catch {
    return false;
  }
};

// Get all services with filtering
exports.getAllServices = async (req, res) => {
  try {
    const {
      category,
      hairType,
      styleCompatibility,
      expertiseRequired,
      minPrice,
      maxPrice,
      isActive,
      sortBy = "popularity",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (isActive !== undefined && isActive !== null && isActive !== "") {
      filter.isActive = isActive === "true" || isActive === true;
    }
    if (category) filter.category = category;
    if (hairType) filter.hairTypes = { $in: Array.isArray(hairType) ? hairType : [hairType] };
    if (styleCompatibility) filter.styleCompatibility = { $in: Array.isArray(styleCompatibility) ? styleCompatibility : [styleCompatibility] };
    if (expertiseRequired) filter.expertiseRequired = { $in: Array.isArray(expertiseRequired) ? expertiseRequired : [expertiseRequired] };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const skip = (page - 1) * limit;
    const services = await Service.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Sanitize image URLs
    const sanitizedServices = services.map((service) => ({
      ...service._doc,
      images: (service.images || []).filter(isValidUrl),
    }));

    const total = await Service.countDocuments(filter);

    res.json({
      services: sanitizedServices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new service
exports.createService = async (req, res) => {
  try {
    const serviceData = { ...req.body };

    // Handle suggestedFor
    if (serviceData.suggestedFor) {
      if (typeof serviceData.suggestedFor === "string") {
        serviceData.suggestedFor = serviceData.suggestedFor.split(",").map(s => s.trim()).filter(s => s);
      } else if (Array.isArray(serviceData.suggestedFor)) {
        serviceData.suggestedFor = serviceData.suggestedFor.filter(s => s && s.trim());
      }
    }

    // Handle images: filter out invalid URLs
    serviceData.images = Array.isArray(serviceData.images)
      ? serviceData.images.filter(isValidUrl)
      : [];
    if (serviceData.images.length === 0) {
      serviceData.images = [];
    }

    const newService = new Service(serviceData);
    await newService.save();
    res.status(201).json(newService);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a service
exports.updateService = async (req, res) => {
  try {
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid service ID format" });
    }

    const serviceData = { ...req.body };

    // Handle suggestedFor
    if (serviceData.suggestedFor) {
      if (typeof serviceData.suggestedFor === "string") {
        serviceData.suggestedFor = serviceData.suggestedFor.split(",").map(s => s.trim()).filter(s => s);
      } else if (Array.isArray(serviceData.suggestedFor)) {
        serviceData.suggestedFor = serviceData.suggestedFor.filter(s => s && s.trim());
      }
    }

    // Handle images: filter out invalid URLs
    serviceData.images = Array.isArray(serviceData.images)
      ? serviceData.images.filter(isValidUrl)
      : [];
    if (serviceData.images.length === 0) {
      serviceData.images = [];
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      serviceData,
      { new: true }
    );

    if (!updatedService) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(updatedService);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a service
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

// Get service by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    // Sanitize image URLs
    const sanitizedService = {
      ...service._doc,
      images: (service.images || []).filter(isValidUrl),
    };
    res.json(sanitizedService);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};