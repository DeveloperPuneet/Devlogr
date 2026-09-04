const Article = require("../models/Article");
const Link = require("../models/Link");
const Profile = require("../models/Profile");
const { getCategorizedRepos } = require("../services/githubService");

exports.renderHome = async (req, res, next) => {
  try {
    const [repoData, links, profile, latestArticles] = await Promise.all([
      getCategorizedRepos(),
      Link.find({ visible: true }).sort({ order: 1, createdAt: 1 }),
      Profile.getSingleton(),
      Article.find({ published: true }).sort({ publishedAt: -1 }).limit(5),
    ]);

    res.render("index", {
      title: "Devlogr — Puneet Kumar Mishra",
      page: "home",
      repoData,
      links,
      profile,
      latestArticles,
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshRepos = async (req, res, next) => {
  try {
    await getCategorizedRepos({ force: true });
    res.redirect("back");
  } catch (err) {
    next(err);
  }
};
