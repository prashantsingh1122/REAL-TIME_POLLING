const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error(`Error: ${err.message}`, err.stack);

  // Prisma error handling
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let message = 'Database error';
    let statusCode = 400;

    switch (err.code) {
      case 'P2002':
        message = 'Resource already exists (unique constraint violation)';
        statusCode = 409;
        break;
      case 'P2025':
        message = 'Resource not found';
        statusCode = 404;
        break;
      case 'P2003':
        message = 'Foreign key constraint violation';
        statusCode = 400;
        break;
      case 'P2021':
        message = 'Table does not exist';
        statusCode = 500;
        break;
      default:
        message = `Database error: ${err.message}`;
        statusCode = 500;
    }

    return res.status(statusCode).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && { details: err.meta })
    });
  }

  // Prisma validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Invalid data provided',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }

  // Validation error (from express-validator or manual validation)
  if (err.name === 'ValidationError' || err.isValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors || err.message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }

  // Cast error (invalid ObjectId format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  });
};

module.exports = errorHandler;