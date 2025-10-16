const rateLimit = require('express-rate-limit');
const adminLimiter = rateLimit({
  windowMs: 15*60*1000,
  max: parseInt(process.env.ADMIN_RATE_LIMIT || '200'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok:false, error: 'Too many requests' }
});
module.exports = { adminLimiter };
