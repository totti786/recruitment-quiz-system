import { jest } from '@jest/globals'
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  errorHandler,
  asyncHandler,
} from '../middleware/errorHandler.js'

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

describe('Error Handler Middleware', () => {
  describe('Custom Error Classes', () => {
    it('creates AppError with default status code', () => {
      const error = new AppError('Test error')

      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
    })

    it('creates AppError with custom status code', () => {
      const error = new AppError('Custom error', 400)

      expect(error.statusCode).toBe(400)
    })

    it('creates NotFoundError', () => {
      const error = new NotFoundError()

      expect(error.message).toBe('Resource not found')
      expect(error.statusCode).toBe(404)
    })

    it('creates ValidationError', () => {
      const error = new ValidationError()

      expect(error.message).toBe('Validation failed')
      expect(error.statusCode).toBe(400)
    })

    it('creates UnauthorizedError', () => {
      const error = new UnauthorizedError()

      expect(error.message).toBe('Unauthorized')
      expect(error.statusCode).toBe(401)
    })

    it('creates ForbiddenError', () => {
      const error = new ForbiddenError()

      expect(error.message).toBe('Forbidden')
      expect(error.statusCode).toBe(403)
    })
  })

  describe('errorHandler', () => {
    it('handles operational errors in production', () => {
      process.env.NODE_ENV = 'production'
      const res = createResponse()

      errorHandler(new AppError('Operational error', 400), {}, res, () => {})

      expect(res.statusCode).toBe(400)
      expect(res.body).toEqual({
        status: 'error',
        message: 'Operational error',
      })

      process.env.NODE_ENV = 'test'
    })

    it('handles programming errors in production', () => {
      process.env.NODE_ENV = 'production'
      const res = createResponse()

      errorHandler(new Error('Programming error'), {}, res, () => {})

      expect(res.statusCode).toBe(500)
      expect(res.body).toEqual({
        status: 'error',
        message: 'Something went wrong',
      })

      process.env.NODE_ENV = 'test'
    })

    it('shows detailed errors in development', () => {
      process.env.NODE_ENV = 'development'
      const res = createResponse()

      errorHandler(new AppError('Dev error', 500), {}, res, () => {})

      expect(res.statusCode).toBe(500)
      expect(res.body).toHaveProperty('status')
      expect(res.body).toHaveProperty('error')
      expect(res.body).toHaveProperty('message', 'Dev error')
      expect(res.body).toHaveProperty('stack')

      process.env.NODE_ENV = 'test'
    })
  })

  describe('asyncHandler', () => {
    it('forwards async errors to next', async () => {
      const next = jest.fn()
      const handler = asyncHandler(async () => {
        throw new Error('Async error')
      })

      await handler({}, {}, next)

      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })

    it('passes successful async responses through', async () => {
      const response = createResponse()
      const handler = asyncHandler(async (req, res) => {
        res.json({ success: true })
      })

      await handler({}, response, () => {})

      expect(response.body).toEqual({ success: true })
    })
  })
})
