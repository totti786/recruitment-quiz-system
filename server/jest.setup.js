// Set test environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing-only'
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'file:./test.db'

// Global test timeout
import { jest } from '@jest/globals'
jest.setTimeout(10000)
