const express = require("express");
const router = express.Router();

const admin = require("../controllers/adminController");
const { requireAdmin, redirectIfLoggedIn } = require("../middleware/auth");

// Auth
router.get("/login", redirectIfLoggedIn, admin.loginPage);
router.post("/login", redirectIfLoggedIn, admin.login);
router.post("/logout", admin.logout);

// Everything below requires an authenticated session
router.use(requireAdmin);

router.get("/", (req, res) => res.redirect("/admin/dashboard"));
router.get("/dashboard", admin.dashboard);

// Articles
router.get("/articles", admin.articlesList);
router.get("/articles/new", admin.articleNewForm);
router.post("/articles/new", admin.articleCreate);
router.get("/articles/:id/edit", admin.articleEditForm);
router.post("/articles/:id/edit", admin.articleUpdate);
router.post("/articles/:id/delete", admin.articleDelete);

// Links
router.get("/links", admin.linksPage);
router.post("/links/new", admin.linkCreate);
router.post("/links/:id/edit", admin.linkUpdate);
router.post("/links/:id/delete", admin.linkDelete);

// Security
router.get("/security", admin.securityPage);
router.post("/security/:id/delete", admin.securityBlockDelete);

// Profile
router.get("/profile", admin.profilePage);
router.post("/profile", admin.profileUpdate);

// Projects (GitHub repo overrides)
router.get("/projects", admin.projectsPage);
router.post("/projects/refresh", admin.projectRefresh);
router.post("/projects/override", admin.projectOverrideSave);

module.exports = router;
