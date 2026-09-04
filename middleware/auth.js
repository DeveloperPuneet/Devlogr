function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  req.session.redirectTo = req.originalUrl;
  return res.redirect("/admin/login");
}

function redirectIfLoggedIn(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return res.redirect("/admin/dashboard");
  }
  next();
}

module.exports = { requireAdmin, redirectIfLoggedIn };
