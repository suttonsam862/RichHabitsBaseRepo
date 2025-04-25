import { Request, Response, NextFunction } from 'express';

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | APIError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    details: (err as APIError).details,
  });

  // Handle database connection errors
  if (err.message.includes('SASL_SIGNATURE_MISMATCH')) {
    return res.status(500).json({
      error: 'Database connection error. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  // Handle authentication errors
  if (err.message.includes('Invalid credentials')) {
    return res.status(401).json({
      error: 'Invalid username or password',
    });
  }

  // Handle API errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.details : undefined,
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    error: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}; 