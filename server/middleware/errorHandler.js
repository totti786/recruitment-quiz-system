export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404)
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403)
  }
}

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    })
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      })
    } else {
      console.error('ERROR 💥', err)
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
      })
    }
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export const validateRequest = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req)
      if (result.errors.length > 0) {
        return res.status(400).json({
          status: 'fail',
          errors: result.errors.map(err => ({
            field: err.path,
            message: err.msg
          }))
        })
      }
    }
    next()
  }
}
