const deliveryPartner = (req, res, next) => {
  // This middleware should run AFTER the 'protect' middleware, so req.user will be available.
  if (req.user && req.user.role === 'Delivery Partner') {
    next(); // If the user has the 'Delivery Partner' role, proceed.
  } else {
    res.status(403).json({ message: 'Not authorized as a Delivery Partner' }); // 403 Forbidden
  }
};

module.exports = { deliveryPartner };