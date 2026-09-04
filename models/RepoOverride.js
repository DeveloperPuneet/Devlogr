const mongoose = require("mongoose");

const repoOverrideSchema = new mongoose.Schema(
  {
    // GitHub repo "owner/name", unique key used to match live API data
    fullName: { type: String, required: true, unique: true, index: true },
    customDescription: { type: String, trim: true, default: "" },
    customLink: { type: String, trim: true, default: "" }, // e.g. live demo URL
    category: {
      type: String,
      enum: ["auto", "latest", "working", "other"],
      default: "auto",
    },
    pinned: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RepoOverride", repoOverrideSchema);
