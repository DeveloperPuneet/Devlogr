/**
 * One-time / repeatable seed script.
 * Run with: npm run seed
 *
 * Populates the Profile singleton and the Links collection with
 * Puneet Kumar Mishra's real details, so the site looks complete
 * the moment it's deployed. Safe to re-run — it upserts rather than
 * duplicating documents.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Profile = require("../models/Profile");
const Link = require("../models/Link");
const Article = require("../models/Article");

async function run() {
  await connectDB();

  // ── Profile ──
  const profile = await Profile.getSingleton();
  profile.name = "Puneet Kumar Mishra";
  profile.handle = "Devlogr";
  profile.location = "India";
  profile.email = process.env.CONTACT_EMAIL || "developerpuneet2010@gmail.com";
  profile.taglineWords = [
    "Full-Stack Developer",
    "Open-Source Builder",
    "AI / ML Explorer",
    "MERN Stack Engineer",
    "Developer Tools Creator",
  ];
  profile.about =
    "I love building things from scratch, experimenting with new technologies, and turning ideas into real software. Currently exploring Python, JavaScript, Machine Learning, AI, Full-Stack Development, and Developer Tools — across three different GitHub accounts and way too many side projects.";
  profile.skillGroups = [
    { category: "Languages", items: ["JavaScript", "Python", "Go", "HTML5", "CSS3"] },
    { category: "Frontend", items: ["React", "EJS", "Responsive Design", "Vite"] },
    { category: "Backend", items: ["Node.js", "Express", "REST APIs", "MVC Architecture"] },
    { category: "Database", items: ["MongoDB", "Mongoose"] },
    { category: "AI / ML", items: ["Machine Learning", "Google Gemini API", "Q-Learning", "Tensorless (own ML framework)"] },
    { category: "Tools", items: ["Git", "GitHub", "VS Code", "Postman", "Vercel"] },
  ];
  await profile.save();
  console.log("✔ Profile seeded");

  // ── Links ──
  const links = [
    { label: "GitHub — DeveloperPuneet", url: "https://github.com/DeveloperPuneet", icon: "github", type: "github", order: 1 },
    { label: "GitHub — SovereignPuneet", url: "https://github.com/SovereignPuneet", icon: "github", type: "github", order: 2 },
    { label: "GitHub — Puneet-Kumar2010", url: "https://github.com/Puneet-Kumar2010", icon: "github", type: "github", order: 3 },
    { label: "Instagram", url: "https://www.instagram.com/_puneet_kumar_mishra_/", icon: "instagram", type: "social", order: 4 },
    { label: "Email", url: "mailto:developerpuneet2010@gmail.com", icon: "mail", type: "contact", order: 5 },
  ];

  for (const link of links) {
    await Link.findOneAndUpdate({ label: link.label }, link, { upsert: true, new: true });
  }
  console.log("✔ Links seeded");

  // ── Welcome article (only if no articles exist yet) ──
  const articleCount = await Article.countDocuments();
  if (articleCount === 0) {
    await Article.create({
      title: "Welcome to Devlogr",
      content: `
        <p>Hey, I'm Puneet 👋 — welcome to <strong>Devlogr</strong>, my corner of the internet where I write about what I'm building, breaking, and learning.</p>
        <h2>What to expect here</h2>
        <p>This blog runs on the same stack as the rest of the portfolio: Node.js, Express, MongoDB and a sprinkle of vanilla JS. Every post you see here is written from the admin panel using plain HTML — headings, images, code blocks, all of it.</p>
        <blockquote>Build. Break. Learn. Repeat.</blockquote>
        <p>Stick around — new posts drop whenever I ship something worth writing about.</p>
      `,
      tags: ["meta", "devlogr"],
      published: true,
    });
    console.log("✔ Welcome article created");
  }

  await mongoose.connection.close();
  console.log("🌱 Seed complete.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
