const mongoose = require("mongoose");

const barberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String, 
    required: true,
  },
  specialty: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true, 
});

module.exports = mongoose.model("Barber", barberSchema);
