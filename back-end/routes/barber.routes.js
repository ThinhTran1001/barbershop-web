const express = require("express");
const router = express.Router();
const barberController = require("../controllers/barber.controller");

router.get("/", barberController.getAllBarbers);
router.post("/", barberController.createBarber);
router.get("/:id", barberController.getBarberById);
router.put("/:id", barberController.updateBarber);
router.delete("/:id", barberController.deleteBarber);

module.exports = router;
