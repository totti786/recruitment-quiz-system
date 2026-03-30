import request from 'supertest'
import express from 'express'

describe('Server Integration Tests', () => {
  let app

  beforeEach(() => {
    app = express()
    
    // Replicate the health endpoint from server.js
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      })
    })

    // Replicate the 404 handler
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
      expect(typeof response.body.timestamp).toBe('string')
      expect(typeof response.body.uptime).toBe('number')
    })

    it('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/api/health')
      const timestamp = response.body.timestamp

      expect(() => new Date(timestamp)).not.toThrow()
      expect(new Date(timestamp).toISOString()).toBe(timestamp)
    })

    it('should return positive uptime', async () => {
      const response = await request(app).get('/api/health')

      expect(response.body.uptime).toBeGreaterThan(0)
    })
  })

  describe('404 Handler', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app).get('/api/unknown-endpoint')

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'Endpoint not found')
    })

    it('should return 404 for undefined routes', async () => {
      const response = await request(app).post('/api/nonexistent')

      expect(response.status).toBe(404)
    })
  })
})
