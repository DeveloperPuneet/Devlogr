const mongoose = require("mongoose");

const securityBlockSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["ip", "network", "device"],
      required: true,
    },
    value: { type: String, required: true },
    reason: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

securityBlockSchema.index({ kind: 1, value: 1 }, { unique: true });

module.exports = mongoose.model("SecurityBlock", securityBlockSchema);