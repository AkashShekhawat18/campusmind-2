// Custom error classes
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

class UnprocessableEntityError extends ApiError {
  constructor(message = 'Unprocessable Entity') {
    super(422, message);
  }
}

const errorHandler = (err, req, res, next) => {
  // Log the actual error for debugging securely on the server
  console.error(`[Error Handler] ${err.name}: ${err.message}`, err.stack);

  // If the error is a custom ApiError, send its specific status and message
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Handle Prisma Database Errors
  if (err.code) {
    if (err.code === 'P2002') {
      // Unique constraint failed
      return res.status(409).json({ error: 'A record with that value already exists' });
    }
    if (err.code === 'P2025') {
      // Record to update not found
      return res.status(404).json({ error: 'Database record not found' });
    }
    if (err.code === 'P2003') {
      // Foreign key constraint failed
      return res.status(400).json({ error: 'Related record not found' });
    }
    // We don't expose other Prisma error details to the client
  }

  // Handle Supabase/JWT Auth Errors
  if (err.name === 'AuthApiError' || err.message.includes('JWT') || err.message.includes('token')) {
    return res.status(401).json({ error: 'Authentication failed' });
  }

  // Generic fallback
  res.status(500).json({ error: 'Internal Server Error' });
};

module.exports = {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  errorHandler
};
