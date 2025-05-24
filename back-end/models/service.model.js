const mongoose = require("mongoose");
//suggestedFor: [String]
const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  steps: [String],
  suggestedFor:[String],
  price: { type: Number, required: true },
  durationMinutes: Number,
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Service", serviceSchema);