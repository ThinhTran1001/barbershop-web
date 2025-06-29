const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/service.controller.js");

router.get("/", serviceController.getAllServices);
router.post("/", serviceController.createService);
router.put("/:id", serviceController.updateService);
router.delete("/:id", serviceController.deleteService);
router.get("/suggestions", serviceController.suggestServices);

module.exports = router;