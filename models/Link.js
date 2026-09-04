const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true }, // e.g. "GitHub — Main"
    url: { type: String, required: true, trim: true },
    icon: { type: String, default: "link" }, // key used to pick an SVG icon, e.g. github, instagram, mail, globe, link
    type: {
      type: String,
      enum: ["github", "social", "contact", "custom"],
      default: "custom",
    },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Link", linkSchema);
