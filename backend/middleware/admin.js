module.exports = function (req, res, next) {
  // Make sure user is authenticated first
  if (!req.user) return res.status(401).json({ msg: 'Not authenticated' });

  const isAdmin =
    req.user.role === 'admin' ||
    req.user.isAdmin === true ||
    req.user.isAdmin === 'true';

  if (!isAdmin) {
    return res.status(403).json({ msg: 'Access denied: Admins only' });
  }

  next();
};
