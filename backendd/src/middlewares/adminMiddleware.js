const admin = (req, res, next) => {
  // We assume this runs AFTER our 'protect' middleware, so req.user is available
  if (req.user && req.user.role === 'Admin') {
    next(); // User is an admin, proceed
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' }); // 403 Forbidden
  }
};

module.exports = { admin };