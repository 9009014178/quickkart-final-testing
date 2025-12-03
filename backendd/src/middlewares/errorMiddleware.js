const logger = require('../utils/logger'); // 1. Logger ko import karo

// Handles requests to routes that don't exist (404)
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass the error to the errorHandler
};

// General error handler - catches all errors
const errorHandler = (err, req, res, next) => {
  // Set status code: if it's 200, change to 500 (server error), else use existing status code
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose specific error handling: CastError (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // 2. Log the error to the file using Winston
  logger.error(
    `${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
    {
      // Log the full error stack trace
      stack: err.stack,
    }
  );

  // 3. Send a clean JSON response to the client
  res.status(statusCode).json({
    message: message,
    // Include stack trace only in development mode for debugging
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };