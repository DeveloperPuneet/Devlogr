require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const indexRoutes = require("./routes/index");
const adminRoutes = require("./routes/admin");
const securityGuard = require("./middleware/security");

const app = express();
const PORT = process.env.PORT || 3000;

async function bootstrap() {
  await connectDB();

  // Pre-hash the admin password from .env once at boot so every login
  // check is a fast bcrypt.compare rather than a plaintext comparison.
  const plainPassword = process.env.ADMIN_PASSWORD || "admin";
  app.locals.adminPasswordHash = await bcrypt.hash(plainPassword, 10);

  // ── View engine ──
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  // ── Core middleware ──
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.set("trust proxy", process.env.TRUST_PROXY === "true");
  app.use(securityGuard);
  app.use(express.static(path.join(__dirname, "public")));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "devlogr_dev_secret",
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
      },
    })
  );

  // Make a couple of globals available to every view
  app.use((req, res, next) => {
    res.locals.isAdmin = !!(req.session && req.session.isAdmin);
    res.locals.currentYear = new Date().getFullYear();
    res.locals.timeAgo = function (date) {
      if (!date) return "";
      const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
      const units = [
        ["year", 31536000],
        ["month", 2592000],
        ["week", 604800],
        ["day", 86400],
        ["hour", 3600],
        ["minute", 60],
      ];
      for (const [name, secs] of units) {
        const value = Math.floor(seconds / secs);
        if (value >= 1) return `${value} ${name}${value > 1 ? "s" : ""} ago`;
      }
      return "just now";
    };
    next();
  });

  // ── Routes ──
  app.use("/admin", adminRoutes);
  app.use("/", indexRoutes);

  // ── 404 ──
  app.use((req, res) => {
    res.status(404).render("404", { title: "Page not found — Devlogr", page: "" });
  });

  // ── Error handler ──
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send(
      process.env.NODE_ENV === "development"
        ? `<pre style="background:#0b0e14;color:#ff6b81;padding:2rem;font-family:monospace">${err.stack}</pre>`
        : "Something went wrong. Please try again shortly."
    );
  });

  app.listen(PORT, () => {
    console.log(`🚀 Devlogr running at http://localhost:${PORT}`);
  });
}

bootstrap();
