// src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info', // Sirf 'info' level ya usse upar ke logs record honge
  format: winston.format.json(), // Log format JSON me hoga
  defaultMeta: { service: 'quickkart-api' },
  transports: [
    // Saare error logs ko 'error.log' file me save karo
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // Saare logs ko 'combined.log' file me save karo
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Agar environment 'development' hai, toh console par bhi log dikhao
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;