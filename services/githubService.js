const axios = require("axios");
const NodeCache = require("node-cache");
const RepoOverride = require("../models/RepoOverride");

const cache = new NodeCache({
  stdTTL: (parseInt(process.env.GITHUB_CACHE_MINUTES, 10) || 30) * 60,
});

const CACHE_KEY = "devlogr:repos";

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Go: "#00ADD8",
  HTML: "#e34c26",
  CSS: "#563d7c",
  EJS: "#a91e50",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  Vue: "#41b883",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Rust: "#dea584",
};

function getUsernames() {
  return (process.env.GITHUB_USERNAMES || "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

function ghHeaders() {
  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchUserRepos(username) {
  try {
    const res = await axios.get(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos`,
      { params: { per_page: 100, sort: "updated" }, headers: ghHeaders(), timeout: 10000 }
    );
    return res.data.map((r) => ({ ...r, __sourceAccount: username }));
  } catch (err) {
    console.warn(`⚠ GitHub fetch failed for ${username}:`, err.response?.status || err.message);
    return [];
  }
}

/**
 * Pull repos from every configured account, merge duplicates (same repo name
 * shared across accounts via forks), and drop each user's own "profile README" repo.
 */
async function fetchAllRepos() {
  const usernames = getUsernames();
  const all = await Promise.all(usernames.map(fetchUserRepos));
  const flat = all.flat();

  const byName = new Map();
  for (const repo of flat) {
    // Skip the special GitHub "profile README" repo (repo name === username)
    if (repo.name.toLowerCase() === repo.owner.login.toLowerCase()) continue;
    if (repo.private) continue;

    const key = repo.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, repo);
    } else {
      // Prefer the non-fork / more-starred / more-recently-updated copy
      const existingScore =
        (existing.fork ? 0 : 2) + existing.stargazers_count * 0.1 + (existing.description ? 1 : 0);
      const newScore = (repo.fork ? 0 : 2) + repo.stargazers_count * 0.1 + (repo.description ? 1 : 0);
      if (newScore > existingScore) byName.set(key, repo);
    }
  }

  return Array.from(byName.values());
}

async function applyOverrides(repos) {
  const overrides = await RepoOverride.find({ fullName: { $in: repos.map((r) => r.full_name) } });
  const map = new Map(overrides.map((o) => [o.fullName, o]));

  return repos
    .map((r) => {
      const o = map.get(r.full_name);
      return {
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        owner: r.owner.login,
        htmlUrl: r.html_url,
        description: (o && o.customDescription) || r.description || "No description provided yet — worth a look though.",
        customLink: (o && o.customLink) || r.homepage || "",
        language: r.language || "Markdown",
        languageColor: LANGUAGE_COLORS[r.language] || "#8b8fa3",
        stars: r.stargazers_count,
        forks: r.forks_count,
        topics: r.topics || [],
        fork: r.fork,
        archived: r.archived,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        pushedAt: r.pushed_at,
        categoryOverride: o ? o.category : "auto",
        pinned: o ? o.pinned : false,
        hidden: o ? o.hidden : false,
      };
    })
    .filter((r) => !r.hidden);
}

/**
 * Returns { latest, working, other, all, stats }
 */
async function getCategorizedRepos({ force = false } = {}) {
  let raw = force ? null : cache.get(CACHE_KEY);
  if (!raw) {
    raw = await fetchAllRepos();
    cache.set(CACHE_KEY, raw);
  }

  const repos = await applyOverrides(raw);

  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

  const pinned = repos.filter((r) => r.pinned);
  const rest = repos.filter((r) => !r.pinned);

  const manualLatest = rest.filter((r) => r.categoryOverride === "latest");
  const manualWorking = rest.filter((r) => r.categoryOverride === "working");
  const manualOther = rest.filter((r) => r.categoryOverride === "other");
  const auto = rest.filter((r) => r.categoryOverride === "auto");

  const autoLatest = [...auto]
    .filter((r) => now - new Date(r.createdAt).getTime() < NINETY_DAYS)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const latestIds = new Set(autoLatest.map((r) => r.id));

  const autoWorking = [...auto]
    .filter((r) => !latestIds.has(r.id) && now - new Date(r.pushedAt).getTime() < THIRTY_DAYS)
    .sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));

  const workingIds = new Set(autoWorking.map((r) => r.id));

  const autoOther = [...auto]
    .filter((r) => !latestIds.has(r.id) && !workingIds.has(r.id))
    .sort((a, b) => b.stars - a.stars || new Date(b.updatedAt) - new Date(a.updatedAt));

  const latest = [...pinned.filter((r) => r.categoryOverride !== "working" && r.categoryOverride !== "other"), ...manualLatest, ...autoLatest]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const working = [...manualWorking, ...autoWorking].sort(
    (a, b) => new Date(b.pushedAt) - new Date(a.pushedAt)
  );

  const other = [...manualOther, ...autoOther].sort((a, b) => b.stars - a.stars);

  const stats = {
    totalRepos: repos.length,
    totalStars: repos.reduce((sum, r) => sum + r.stars, 0),
    totalForks: repos.reduce((sum, r) => sum + r.forks, 0),
    languages: [...new Set(repos.map((r) => r.language).filter(Boolean))],
  };

  return { latest, working, other, all: repos, stats };
}

function clearCache() {
  cache.del(CACHE_KEY);
}

module.exports = { getCategorizedRepos, clearCache, getUsernames, LANGUAGE_COLORS };
