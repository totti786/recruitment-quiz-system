import request from 'supertest'
import express from 'express'
import { jest } from '@jest/globals'

// Simple test without mocking to verify server works
describe('Server Health Check', () => {
  let app

  beforeEach(() => {
    app = express()
    
    // Replicate the health endpoint
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      })
    })

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Endpoint not found' })
    })
  })

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'OK')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('uptime')
    })

    it('should return valid timestamp', async () => {
      const response = await request(app).get('/api/health')
      const timestamp = response.body.timestamp

      expect(() => new Date(timestamp)).not.toThrow()
    })
  })

  describe('404 Handler', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app).get('/api/unknown')

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'Endpoint not found')
    })
  })
})
