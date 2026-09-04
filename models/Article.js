const mongoose = require("mongoose");
const slugify = require("slugify");

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, trim: true, maxlength: 240 },
    coverImage: { type: String, trim: true, default: "" },
    content: { type: String, required: true }, // sanitized raw HTML
    tags: [{ type: String, trim: true }],
    readTimeMinutes: { type: Number, default: 3 },
    published: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

articleSchema.pre("validate", function (next) {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  if (!this.excerpt && this.content) {
    const text = this.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    this.excerpt = text.slice(0, 180) + (text.length > 180 ? "…" : "");
  }
  if (this.content) {
    const words = this.content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length;
    this.readTimeMinutes = Math.max(1, Math.round(words / 200));
  }
  next();
});

articleSchema.index({ title: "text", excerpt: "text", tags: "text" });

module.exports = mongoose.model("Article", articleSchema);
