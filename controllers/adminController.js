const bcrypt = require("bcryptjs");
const sanitizeHtml = require("sanitize-html");
const slugify = require("slugify");

const Article = require("../models/Article");
const Link = require("../models/Link");
const Profile = require("../models/Profile");
const RepoOverride = require("../models/RepoOverride");
const { getCategorizedRepos, clearCache } = require("../services/githubService");

// ── Sanitizer config: lets the admin paste raw HTML (h1, img, etc.) safely ──
const SANITIZE_OPTIONS = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "div", "span",
    "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup",
    "ul", "ol", "li", "blockquote", "code", "pre", "a", "img", "figure",
    "figcaption", "table", "thead", "tbody", "tr", "th", "td", "video",
    "source",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "class"],
    img: ["src", "alt", "title", "width", "height", "class", "loading"],
    video: ["src", "controls", "width", "height", "class"],
    source: ["src", "type"],
    "*": ["class", "id", "style"],
  },
  allowedSchemes: ["http", "https", "mailto", "data"],
  allowedStyles: {
    "*": {
      color: [/.*/],
      "text-align": [/.*/],
      "font-weight": [/.*/],
    },
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
};

function sanitize(html) {
  return sanitizeHtml(html || "", SANITIZE_OPTIONS);
}

// ─────────────────────────── AUTH ───────────────────────────

exports.loginPage = (req, res) => {
  res.render("admin/login", { title: "Admin Login — Devlogr", page: "admin", error: null, layout: false });
};

exports.login = async (req, res) => {
  const { password } = req.body;
  const adminHash = req.app.locals.adminPasswordHash;

  const ok = adminHash && (await bcrypt.compare(password || "", adminHash));
  if (!ok) {
    return res.status(401).render("admin/login", {
      title: "Admin Login — Devlogr",
      page: "admin",
      error: "Incorrect password. Try again.",
      layout: false,
    });
  }

  req.session.isAdmin = true;
  const redirectTo = req.session.redirectTo || "/admin/dashboard";
  delete req.session.redirectTo;
  res.redirect(redirectTo);
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
};

// ─────────────────────────── DASHBOARD ───────────────────────────

exports.dashboard = async (req, res, next) => {
  try {
    const [articles, links, profile, repoData] = await Promise.all([
      Article.find().sort({ createdAt: -1 }).limit(6),
      Link.find().sort({ order: 1 }),
      Profile.getSingleton(),
      getCategorizedRepos(),
    ]);

    const articleCount = await Article.countDocuments();

    res.render("admin/dashboard", {
      title: "Dashboard — Devlogr Admin",
      page: "dashboard",
      articles,
      articleCount,
      links,
      profile,
      repoData,
      layout: false,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────── ARTICLES ───────────────────────────

exports.articlesList = async (req, res, next) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.render("admin/articles", { title: "Manage Articles — Devlogr Admin", page: "articles", articles, layout: false });
  } catch (err) {
    next(err);
  }
};

exports.articleNewForm = (req, res) => {
  res.render("admin/article-form", {
    title: "New Article — Devlogr Admin",
    page: "articles",
    article: null,
    layout: false,
  });
};

exports.articleEditForm = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.redirect("/admin/articles");
    res.render("admin/article-form", {
      title: "Edit Article — Devlogr Admin",
      page: "articles",
      article,
      layout: false,
    });
  } catch (err) {
    next(err);
  }
};

exports.articleCreate = async (req, res, next) => {
  try {
    const { title, excerpt, coverImage, content, tags, published } = req.body;
    const cleanContent = sanitize(content);

    await Article.create({
      title,
      slug: slugify(title, { lower: true, strict: true }) + "-" + Date.now().toString(36),
      excerpt: excerpt || undefined,
      coverImage,
      content: cleanContent,
      tags: (tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      published: published === "on" || published === "true",
    });

    res.redirect("/admin/articles");
  } catch (err) {
    next(err);
  }
};

exports.articleUpdate = async (req, res, next) => {
  try {
    const { title, excerpt, coverImage, content, tags, published } = req.body;
    const article = await Article.findById(req.params.id);
    if (!article) return res.redirect("/admin/articles");

    article.title = title;
    article.excerpt = excerpt;
    article.coverImage = coverImage;
    article.content = sanitize(content);
    article.tags = (tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    article.published = published === "on" || published === "true";

    await article.save();
    res.redirect("/admin/articles");
  } catch (err) {
    next(err);
  }
};

exports.articleDelete = async (req, res, next) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res.redirect("/admin/articles");
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────── LINKS ───────────────────────────

exports.linksPage = async (req, res, next) => {
  try {
    const links = await Link.find().sort({ order: 1 });
    res.render("admin/links", { title: "Manage Links — Devlogr Admin", page: "links", links, layout: false });
  } catch (err) {
    next(err);
  }
};

exports.linkCreate = async (req, res, next) => {
  try {
    const { label, url, icon, type, order } = req.body;
    await Link.create({ label, url, icon, type, order: Number(order) || 0 });
    res.redirect("/admin/links");
  } catch (err) {
    next(err);
  }
};

exports.linkUpdate = async (req, res, next) => {
  try {
    const { label, url, icon, type, order, visible } = req.body;
    await Link.findByIdAndUpdate(req.params.id, {
      label,
      url,
      icon,
      type,
      order: Number(order) || 0,
      visible: visible === "on" || visible === "true",
    });
    res.redirect("/admin/links");
  } catch (err) {
    next(err);
  }
};

exports.linkDelete = async (req, res, next) => {
  try {
    await Link.findByIdAndDelete(req.params.id);
    res.redirect("/admin/links");
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────── PROFILE ───────────────────────────

exports.profilePage = async (req, res, next) => {
  try {
    const profile = await Profile.getSingleton();
    res.render("admin/profile", { title: "Edit Profile — Devlogr Admin", page: "profile", profile, layout: false });
  } catch (err) {
    next(err);
  }
};

exports.profileUpdate = async (req, res, next) => {
  try {
    const { name, handle, about, location, email, resumeUrl, taglineWords, skillGroupsJson } = req.body;
    const profile = await Profile.getSingleton();

    profile.name = name;
    profile.handle = handle;
    profile.about = about;
    profile.location = location;
    profile.email = email;
    profile.resumeUrl = resumeUrl;
    profile.taglineWords = (taglineWords || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const parsed = JSON.parse(skillGroupsJson || "[]");
      if (Array.isArray(parsed)) profile.skillGroups = parsed;
    } catch (_) {
      /* keep existing skill groups if JSON is malformed */
    }

    await profile.save();
    res.redirect("/admin/profile");
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────── PROJECTS / REPO OVERRIDES ───────────────────────────

exports.projectsPage = async (req, res, next) => {
  try {
    const repoData = await getCategorizedRepos();
    res.render("admin/projects", { title: "Manage Projects — Devlogr Admin", page: "projects", repoData, layout: false });
  } catch (err) {
    next(err);
  }
};

exports.projectRefresh = async (req, res, next) => {
  try {
    clearCache();
    await getCategorizedRepos({ force: true });
    res.redirect("/admin/projects");
  } catch (err) {
    next(err);
  }
};

exports.projectOverrideSave = async (req, res, next) => {
  try {
    const { fullName, customDescription, customLink, category, pinned, hidden } = req.body;
    await RepoOverride.findOneAndUpdate(
      { fullName },
      {
        fullName,
        customDescription,
        customLink,
        category: category || "auto",
        pinned: pinned === "on" || pinned === "true",
        hidden: hidden === "on" || hidden === "true",
      },
      { upsert: true, new: true }
    );
    res.redirect("/admin/projects");
  } catch (err) {
    next(err);
  }
};
