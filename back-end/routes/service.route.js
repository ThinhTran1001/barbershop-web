const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/service.controller.js");

router.get("/", serviceController.getAllServices);
router.post("/", serviceController.createService);
router.put("/:id", serviceController.updateService);
router.delete("/:id", serviceController.deleteService);

module.exports = router;