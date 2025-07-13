const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/service.controller.js");

// Service CRUD operations
router.get("/", serviceController.getAllServices);
router.post("/", serviceController.createService);
router.put("/:id", serviceController.updateService);
router.delete("/:id", serviceController.deleteService);

// Service recommendations and suggestions
router.get("/suggestions", serviceController.suggestServices);

// Service filtering and search
router.get("/categories", serviceController.getServiceCategories);
router.get("/hair-types", serviceController.getHairTypes);
router.get("/style-compatibility", serviceController.getStyleCompatibility);
router.get("/search", serviceController.searchServices);

module.exports = router;