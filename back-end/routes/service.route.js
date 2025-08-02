const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/service.controller.js");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", serviceController.getAllServices);

// Specific routes must come before the generic /:id route
router.get("/categories", serviceController.getServiceCategories);
router.get("/hair-types", serviceController.getHairTypes);
router.get("/style-compatibility", serviceController.getStyleCompatibility);
router.get("/suggestions", serviceController.getServiceSuggestions);

router.get("/:id", serviceController.getServiceById);
router.post("/", serviceController.createService);
router.put("/:id", serviceController.updateService);
router.delete("/:id", serviceController.deleteService);

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Không có file được tải lên" });
    }
    const result = await cloudinary.uploader.upload_stream(
      { folder: "services" },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: "Tải lên Cloudinary thất bại" });
        }
        res.json({ url: result.secure_url });
      }
    ).end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;