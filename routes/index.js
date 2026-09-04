const express = require("express");
const router = express.Router();

const homeController = require("../controllers/homeController");
const articleController = require("../controllers/articleController");

router.get("/", homeController.renderHome);
router.post("/refresh-repos", homeController.refreshRepos);

router.get("/articles", articleController.list);
router.get("/articles/:slug", articleController.show);

module.exports = router;
