const Article = require("../models/Article");
const Link = require("../models/Link");
const Profile = require("../models/Profile");

const PAGE_SIZE = 9;

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const tag = req.query.tag || null;
    const query = { published: true };
    if (tag) query.tags = tag;

    const [articles, total, links, profile, allTags] = await Promise.all([
      Article.find(query)
        .sort({ publishedAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE),
      Article.countDocuments(query),
      Link.find({ visible: true }).sort({ order: 1 }),
      Profile.getSingleton(),
      Article.distinct("tags"),
    ]);

    res.render("articles", {
      title: "Articles & Blogs — Devlogr",
      page: "articles",
      articles,
      links,
      profile,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      activeTag: tag,
      allTags,
    });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug, published: true });
    if (!article) return res.status(404).render("404", { title: "Not found", page: "" });

    article.views += 1;
    await article.save();

    const [links, profile, related] = await Promise.all([
      Link.find({ visible: true }).sort({ order: 1 }),
      Profile.getSingleton(),
      Article.find({
        published: true,
        _id: { $ne: article._id },
        tags: { $in: article.tags.length ? article.tags : ["__none__"] },
      })
        .sort({ publishedAt: -1 })
        .limit(3),
    ]);

    res.render("article", {
      title: `${article.title} — Devlogr`,
      page: "articles",
      article,
      links,
      profile,
      related,
    });
  } catch (err) {
    next(err);
  }
};
