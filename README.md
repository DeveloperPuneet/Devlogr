# Devlogr

**Devlogr** is Puneet Kumar Mishra's animated developer portfolio, live GitHub project tracker, and blog — built as a classic **MVC** app with **Express**, **MongoDB/Mongoose**, and **EJS**. No frontend framework, no build step: just a fast server-rendered site with a genuinely cool, animated UI.

- 🟢 **Live GitHub sync** — pulls repos from `DeveloperPuneet`, `SovereignPuneet` and `Puneet-Kumar2010`, merges duplicates, and auto-sorts them into **Latest Projects**, **Working On** (recent commits) and **All Other Projects**.
- 📝 **Blog / Articles** — write posts as raw HTML (`<h1>`, `<img src="">`, etc.) from the admin panel, with a live preview pane. Sanitized server-side so it's safe to publish.
- 🔐 **Password-protected admin panel** — manage articles, links, your profile/skills, and per-repo overrides (custom description, pin, hide, force category).
- 🛡️ **Persistent bot protection** — rapid traffic is tracked by IP, network range, and a device cookie; abusive signatures are blocked in MongoDB for four months.
- 🎨 **Extremely animated UI** — gradient hero text, typewriter effect, floating background blobs, scroll-reveal, tildone project cards, infinite tech marquee, animated stat counters, glowing "working on" timeline.

---

## 1. Requirements

- Node.js 18+
- A MongoDB database (either a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster, or a local `mongod`)

## 2. Setup

```bash
cd devlogr
npm install
cp .env.example .env
```

Now open `.env` and fill in:

| Variable | What it is |
|---|---|
| `MONGODB_URI` | Your MongoDB connection string |
| `SESSION_SECRET` | Any long random string |
| `ADMIN_PASSWORD` | The password you'll use to log into `/admin` |
| `GITHUB_USERNAMES` | Already set to your 3 accounts — edit if needed |
| `GITHUB_TOKEN` | *(optional but recommended)* A GitHub Personal Access Token with no special scopes — raises the API rate limit from 60/hr to 5,000/hr. Create one at github.com/settings/tokens |
| `CONTACT_EMAIL` / `INSTAGRAM_HANDLE` | Used by the seed script |
| `SECURITY_REQUEST_LIMIT` / `SECURITY_LONG_REQUEST_LIMIT` | Per-minute and ten-minute request limits before a four-month block (defaults: `120` / `600`) |
| `TRUST_PROXY` | Set to `true` only behind a trusted reverse proxy so client IP detection uses forwarded addresses |

## 3. Seed your profile (recommended, one time)

This pre-fills your name, bio, skills, GitHub/Instagram links and a starter blog post so the site isn't empty on first load:

```bash
npm run seed
```

You can always edit everything again later from the admin panel — this just gives you a real starting point instead of a blank site.

## 4. Run it

```bash
npm run dev     # with nodemon, auto-restarts on file changes
# or
npm start
```

Visit **http://localhost:3000** for the site, and **http://localhost:3000/admin/login** for the admin panel (password = whatever you set as `ADMIN_PASSWORD`).

---

## Project Structure (MVC)

```
devlogr/
├── server.js                 # App entry point
├── config/db.js              # Mongoose connection
├── models/                   # Article, Link, Profile, RepoOverride
├── controllers/               # home, article, admin logic
├── routes/                   # index.js (public), admin.js (protected)
├── services/githubService.js # Fetches + merges + categorizes repos from all 3 GitHub accounts, cached in memory
├── middleware/
│   ├── auth.js               # requireAdmin session guard
│   └── security.js           # persistent rate and bot protection
├── views/                    # EJS templates
│   ├── partials/             # head, nav, footer, project-card
│   ├── admin/                # login, dashboard, articles, article-form, links, profile, projects
│   ├── index.ejs, articles.ejs, article.ejs, 404.ejs
├── public/
│   ├── css/style.css         # Main site styles (dark glassmorphism theme)
│   ├── css/admin.css         # Admin panel styles
│   ├── js/main.js            # Nav, typewriter, scroll reveal, tabs, tilt, counters
│   ├── js/admin.js           # Write/Preview toggle for the article editor
│   └── images/logo.svg       # Placeholder logo — replace with your own PNG/SVG here
└── scripts/seedProfile.js    # One-time content seeder
```

## How the "Latest / Working On / Other" sorting works

`services/githubService.js` fetches every public repo from all usernames in `GITHUB_USERNAMES`, dedupes repos that appear in more than one account (e.g. forks), and then buckets them:

- **Latest Projects** — repos **created** in the last 90 days, newest first (max 6 shown).
- **Working On** — everything else **pushed to** in the last 30 days, most recent first. Rendered as a glowing timeline.
- **All Other Projects** — everything remaining, sorted by star count.

You can always override this per-repo from **Admin → Projects**: force a category, pin something to "Latest", hide a repo entirely, or replace its description/add a live demo link — without touching GitHub itself. Overrides are stored in MongoDB and layered on top of the live API data, so nothing is ever hardcoded.

Repo data is cached in memory for `GITHUB_CACHE_MINUTES` (default 30) to avoid hitting GitHub's rate limit — hit "↻ Force Refresh from GitHub" in the admin panel to bust the cache immediately after pushing new commits.

## Writing articles

Go to **Admin → Articles → + New Article**. The content field accepts raw HTML:

```html
<h1>My heading</h1>
<p>Some text with an <a href="https://example.com">inline link</a>.</p>
<img src="https://example.com/screenshot.png" alt="Screenshot" />
<blockquote>A quote worth pulling out.</blockquote>
<pre><code>const hello = "world";</code></pre>
```

Click **👁️ Preview** anytime to see exactly how it will render before publishing. Content is sanitized on save (via `sanitize-html`) — scripts and dangerous attributes are stripped, but headings, images, links, lists, code blocks, tables, and inline styles/classes are allowed.

## Deploying

Any Node host works (Render, Railway, Fly.io, a VPS, etc.):

1. Push this repo (excluding `.env`, which is git-ignored).
2. Set the same environment variables from `.env.example` in your host's dashboard.
3. Use a MongoDB Atlas connection string for `MONGODB_URI` (Atlas has a free tier).
4. Start command: `npm start`.
5. Run `npm run seed` once against the production database (or just fill everything in through `/admin` manually).

## Customizing

- **Logo** — drop your own file at `public/images/logo.svg` (or update the `<img src>` in `views/partials/nav.ejs` / `footer.ejs` to a `.png`).
- **Colors** — all theme colors are CSS variables at the top of `public/css/style.css` (`--violet`, `--cyan`, `--pink`, etc.).
- **Skills / About / Tagline** — edit from **Admin → Profile**.
- **Links (GitHub, Instagram, custom)** — edit from **Admin → Links**.

---

Built with Node.js, Express, MongoDB, Mongoose, and EJS. No frontend framework required.
