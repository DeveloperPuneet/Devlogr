const mongoose = require("mongoose");

const skillGroupSchema = new mongoose.Schema(
  {
    category: { type: String, required: true }, // e.g. "Languages", "Frontend", "Backend", "Tools"
    items: [{ type: String }],
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Puneet Kumar Mishra" },
    handle: { type: String, default: "Devlogr" },
    taglineWords: {
      type: [String],
      default: [
        "Full-Stack Developer",
        "Open-Source Builder",
        "AI / ML Explorer",
        "MERN Stack Engineer",
      ],
    },
    about: {
      type: String,
      default:
        "I love building things from scratch, experimenting with new technologies, and turning ideas into real software. Currently exploring Python, JavaScript, Machine Learning, AI, Full-Stack Development, and Developer Tools.",
    },
    location: { type: String, default: "India" },
    email: { type: String, default: process.env.CONTACT_EMAIL || "" },
    resumeUrl: { type: String, default: "" },
    skillGroups: {
      type: [skillGroupSchema],
      default: [
        { category: "Languages", items: ["JavaScript", "Python", "Go", "HTML5", "CSS3"] },
        { category: "Frontend", items: ["React", "EJS", "Tailwind", "Vite"] },
        { category: "Backend", items: ["Node.js", "Express", "REST APIs", "MVC Architecture"] },
        { category: "Database", items: ["MongoDB", "Mongoose"] },
        { category: "AI / ML", items: ["Machine Learning", "Google Gemini API", "Q-Learning"] },
        { category: "Tools", items: ["Git", "GitHub", "VS Code", "Postman", "Vercel"] },
      ],
    },
  },
  { timestamps: true }
);

// Enforce a single profile document (singleton)
profileSchema.statics.getSingleton = async function () {
  let profile = await this.findOne();
  if (!profile) profile = await this.create({});
  return profile;
};

module.exports = mongoose.model("Profile", profileSchema);
