const Service = require("../models/service.model");

// Lấy tất cả dịch vụ với filtering
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
      sortBy = 'popularity',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object
    const filter = {};
    if (isActive !== undefined && isActive !== null && isActive !== "") {
      filter.isActive = isActive === 'true' || isActive === true;
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

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const services = await Service.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Service.countDocuments(filter);

    res.json({
      services,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo dịch vụ mới
exports.createService = async (req, res) => {
  try {
    const serviceData = { ...req.body };
    
    // Xử lý suggestedFor - luôn convert thành array
    if (serviceData.suggestedFor) {
      if (typeof serviceData.suggestedFor === 'string') {
        serviceData.suggestedFor = serviceData.suggestedFor.split(',').map(s => s.trim()).filter(s => s);
      } else if (Array.isArray(serviceData.suggestedFor)) {
        serviceData.suggestedFor = serviceData.suggestedFor.filter(s => s && s.trim());
      }
    }
    
                    // Xử lý imageUrl từ Cloudinary
                console.log('Create Service - data received:', serviceData);
                if (serviceData.imageUrl) {
                  console.log('Create Service - ImageUrl from frontend:', serviceData.imageUrl);
                } else {
                  serviceData.imageUrl = 'https://via.placeholder.com/500x500/cccccc/666666?text=Service+Image';
                  console.log('Create Service - Using placeholder imageUrl');
                }

                const newService = new Service(serviceData);
    await newService.save();
    res.status(201).json(newService);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật dịch vụ
exports.updateService = async (req, res) => {
  try {
    // Validate service ID
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid service ID format" });
    }
    
    const serviceData = { ...req.body };
    
    // Xử lý suggestedFor - luôn convert thành array
    if (serviceData.suggestedFor) {
      if (typeof serviceData.suggestedFor === 'string') {
        serviceData.suggestedFor = serviceData.suggestedFor.split(',').map(s => s.trim()).filter(s => s);
      } else if (Array.isArray(serviceData.suggestedFor)) {
        serviceData.suggestedFor = serviceData.suggestedFor.filter(s => s && s.trim());
      }
    }
    
                    // Xử lý imageUrl từ Cloudinary
                console.log('Update Service - data received:', serviceData);
                if (serviceData.imageUrl) {
                  console.log('Update Service - ImageUrl from frontend:', serviceData.imageUrl);
                } else {
                  serviceData.imageUrl = 'https://via.placeholder.com/500x500/cccccc/666666?text=Service+Image';
                  console.log('Update Service - Using placeholder imageUrl');
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

// Xóa dịch vụ
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

// Lấy dịch vụ theo ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


