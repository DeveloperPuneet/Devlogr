# Contributing to Devlogr

Thank you for taking the time to contribute! **Devlogr** is an open-source project focused on building modern developer tools, AI/ML experiments, and full-stack web applications. Contributions from developers of all skill levels are welcome.

---

## 🚀 Getting Started

Before contributing, please make sure you have the following installed on your machine:

- **Node.js** (v18.x or higher) / **npm** or **pnpm**
- **Python** (v3.10 or higher) — *if working on AI/ML or backend services*
- **Git**

### 1. Fork and Clone the Repository

1. Fork the repository to your own GitHub account.
2. Clone your fork locally:
   ```bash
   git clone [https://github.com/YOUR-USERNAME/Devlogr.git](https://github.com/YOUR-USERNAME/Devlogr.git)
   cd Devlogr
Set the upstream remote:

Bash
git remote add upstream [https://github.com/DeveloperPuneet/Devlogr.git](https://github.com/DeveloperPuneet/Devlogr.git)
2. Set Up the Project
Install the project dependencies locally:

Bash
# For Frontend / JavaScript
npm install

# For Python / ML environments (if applicable)
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
🛠️ How to Contribute
1. Reporting Bugs
If you find a bug or unexpected behavior:

Check the Issues tab to see if it has already been reported.

If not, open a new Issue using the Bug Report template.

Include steps to reproduce the issue, expected vs. actual behavior, and relevant screenshots or logs.

2. Proposing Features or Enhancements
Have an idea for a new feature or improvement?

Open a new Issue describing the feature, why it’s useful, and any design or implementation ideas.

Wait for feedback before starting work to ensure it aligns with the project roadmap.

3. Submitting Pull Requests (PRs)
Create a new branch off main:

Bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-fix
Make your changes following the project's code style and conventions.

Run tests & linters to ensure everything builds smoothly:

Bash
npm run lint
npm run test
Commit your changes with clear, descriptive commit messages:

Bash
git commit -m "feat: add dark mode support to blog card"
Push to your fork and open a Pull Request:

Bash
git push origin feat/your-feature-name
Describe your changes clearly in the PR template and reference any relevant issue numbers (e.g., Fixes #12).
