const Service = require("../models/service.model");
const CustomerServiceHistory = require("../models/customer-service-history.model");

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
      isActive = true,
      sortBy = 'popularity',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object
    const filter = { isActive };

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

// Gợi ý dịch vụ thông minh dựa trên nhiều yếu tố
exports.suggestServices = async (req, res) => {
  try {
    const { hairType, stylePreference, userId, limit = 10 } = req.query;
    let suggestions = [];
    let recommendationReason = [];

    if (userId) {
      // Lấy preferences từ lịch sử khách hàng
      const preferences = await CustomerServiceHistory.getCustomerPreferences(userId);

      if (preferences) {
        // Gợi ý dựa trên dịch vụ đã sử dụng và đánh giá cao
        const highRatedServices = Object.entries(preferences.serviceRatings)
          .filter(([, rating]) => rating >= 4)
          .map(([serviceId]) => serviceId);

        if (highRatedServices.length > 0) {
          // Tìm dịch vụ tương tự với những dịch vụ đã đánh giá cao
          const relatedServices = await Service.find({
            _id: { $nin: highRatedServices },
            $or: [
              { category: { $in: await Service.find({ _id: { $in: highRatedServices } }).distinct('category') } },
              { hairTypes: { $in: preferences.lastHairType ? [preferences.lastHairType] : [] } },
              { styleCompatibility: { $in: preferences.lastStyle ? [preferences.lastStyle] : [] } }
            ],
            isActive: true
          }).limit(Number(limit));

          suggestions = relatedServices;
          recommendationReason.push('Based on your highly rated services');
        }
      }
    }

    // Nếu chưa có đủ gợi ý từ lịch sử, bổ sung dựa trên hairType và stylePreference
    if (suggestions.length < limit) {
      const additionalFilter = { isActive: true };

      if (hairType) {
        additionalFilter.hairTypes = hairType;
        recommendationReason.push(`Suitable for ${hairType} hair`);
      }

      if (stylePreference) {
        additionalFilter.styleCompatibility = stylePreference;
        recommendationReason.push(`Compatible with ${stylePreference} style`);
      }

      const additionalServices = await Service.find({
        ...additionalFilter,
        _id: { $nin: suggestions.map(s => s._id) }
      })
      .sort({ popularity: -1, averageRating: -1 })
      .limit(Number(limit) - suggestions.length);

      suggestions = [...suggestions, ...additionalServices];
    }

    // Nếu vẫn chưa đủ, lấy các dịch vụ phổ biến nhất
    if (suggestions.length < limit) {
      const popularServices = await Service.find({
        isActive: true,
        _id: { $nin: suggestions.map(s => s._id) }
      })
      .sort({ popularity: -1 })
      .limit(Number(limit) - suggestions.length);

      suggestions = [...suggestions, ...popularServices];
      if (popularServices.length > 0) {
        recommendationReason.push('Popular services');
      }
    }

    res.json({
      suggestions: suggestions.slice(0, Number(limit)),
      recommendationReason,
      total: suggestions.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all service categories
exports.getServiceCategories = async (req, res) => {
  try {
    const categories = await Service.distinct('category', { isActive: true });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all hair types
exports.getHairTypes = async (req, res) => {
  try {
    const hairTypes = await Service.distinct('hairTypes', { isActive: true });
    res.json(hairTypes.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all style compatibility options
exports.getStyleCompatibility = async (req, res) => {
  try {
    const styles = await Service.distinct('styleCompatibility', { isActive: true });
    res.json(styles.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Search services by name or description
exports.searchServices = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchRegex = new RegExp(q, 'i');
    const services = await Service.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { steps: { $in: [searchRegex] } }
      ]
    })
    .sort({ popularity: -1 })
    .limit(Number(limit));

    res.json({
      services,
      query: q,
      total: services.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
