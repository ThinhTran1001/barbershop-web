const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  steps: [String],
  suggestedFor:["tóc mỏng", "tóc dài"],
  price: { type: Number, required: true },
  durationMinutes: Number,
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Service", serviceSchema);