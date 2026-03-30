import request from 'supertest'
import express from 'express'
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  errorHandler,
  asyncHandler,
} from '../middleware/errorHandler.js'

describe('Error Handler Middleware', () => {
  let app

  beforeEach(() => {
    app = express()
    app.use(express.json())
  })

  describe('Custom Error Classes', () => {
    it('should create AppError with default status code', () => {
      const error = new AppError('Test error')
      
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
    })

    it('should create AppError with custom status code', () => {
      const error = new AppError('Custom error', 400)
      
      expect(error.statusCode).toBe(400)
    })

    it('should create NotFoundError', () => {
      const error = new NotFoundError()
      
      expect(error.message).toBe('Resource not found')
      expect(error.statusCode).toBe(404)
    })

    it('should create NotFoundError with custom message', () => {
      const error = new NotFoundError('User not found')
      
      expect(error.message).toBe('User not found')
    })

    it('should create ValidationError', () => {
      const error = new ValidationError()
      
      expect(error.message).toBe('Validation failed')
      expect(error.statusCode).toBe(400)
    })

    it('should create UnauthorizedError', () => {
      const error = new UnauthorizedError()
      
      expect(error.message).toBe('Unauthorized')
      expect(error.statusCode).toBe(401)
    })

    it('should create ForbiddenError', () => {
      const error = new ForbiddenError()
      
      expect(error.message).toBe('Forbidden')
      expect(error.statusCode).toBe(403)
    })
  })

  describe('errorHandler', () => {
    it('should handle operational errors in production', async () => {
      process.env.NODE_ENV = 'production'
      
      app.get('/test', () => {
        throw new AppError('Operational error', 400)
      })
      app.use(errorHandler)

      const response = await request(app).get('/test')

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        status: 'error',
        message: 'Operational error',
      })
      
      process.env.NODE_ENV = 'test'
    })

    it('should handle programming errors in production', async () => {
      process.env.NODE_ENV = 'production'
      
      app.get('/test', () => {
        const error = new Error('Programming error')
        throw error
      })
      app.use(errorHandler)

      const response = await request(app).get('/test')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({
        status: 'error',
        message: 'Something went wrong',
      })
      
      process.env.NODE_ENV = 'test'
    })

    it('should show detailed error in development', async () => {
      process.env.NODE_ENV = 'development'
      
      app.get('/test', () => {
        throw new AppError('Dev error', 500)
      })
      app.use(errorHandler)

      const response = await request(app).get('/test')

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('error')
      expect(response.body).toHaveProperty('message', 'Dev error')
      expect(response.body).toHaveProperty('stack')
      
      process.env.NODE_ENV = 'test'
    })

    it('should default to 500 status code', async () => {
      process.env.NODE_ENV = 'production'
      
      app.get('/test', () => {
        const error = new Error('No status code')
        error.isOperational = true
        throw error
      })
      app.use(errorHandler)

      const response = await request(app).get('/test')

      expect(response.status).toBe(500)
      
      process.env.NODE_ENV = 'test'
    })
  })

  describe('asyncHandler', () => {
    it('should catch errors in async functions', async () => {
      app.get('/test', asyncHandler(async () => {
        throw new Error('Async error')
      }))
      app.use(errorHandler)

      const response = await request(app).get('/test')

      expect(response.status).toBe(500)
    })

    it('should pass successful responses', async () => {
      app.get('/test', asyncHandler(async (req, res) => {
        res.json({ success: true })
      }))

      const response = await request(app).get('/test')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ success: true })
    })
  })
})
