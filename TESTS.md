# Testing Guide

This project includes comprehensive testing for both the server and client applications.

## Overview

- **Server Tests**: Jest with Supertest for API endpoint testing
- **Client Tests**: Vitest with React Testing Library for component testing
- **Coverage**: Code coverage reports generated for both server and client
- **CI/CD**: GitHub Actions workflow for automated testing on every push/PR

## Running Tests

### Run All Tests
```bash
npm test
```

### Server Tests Only
```bash
cd server && npm test
# or
npm run test:server
```

### Client Tests Only
```bash
cd client && npm test
# or
npm run test:client
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### With Coverage Reports
Tests automatically generate coverage reports. View them at:
- Server: `server/coverage/lcov-report/index.html`
- Client: `client/coverage/index.html`

## Test Structure

### Server Tests (`server/__tests__/`)

| Test File | Description |
|-----------|-------------|
| `auth.test.js` | Authentication endpoints (login, verify, change password) |
| `candidates.test.js` | Candidate CRUD operations |
| `departments.test.js` | Department management |
| `questions.test.js` | Question bank management |
| `quizzes.test.js` | Quiz creation and management |
| `sessions.test.js` | Session management |
| `quiz-sessions.test.js` | Quiz taking interface |
| `dashboard.test.js` | Dashboard statistics and results |
| `server.test.js` | Health endpoint and server integration |
| `errorHandler.test.js` | Error handling middleware |

### Client Tests (`client/src/test/`)

| Test File | Description |
|-----------|-------------|
| `Login.test.jsx` | Login page component |
| `ProtectedRoute.test.jsx` | Authentication route protection |
| `useAuthStore.test.js` | Authentication state management |
| `api.test.js` | API utility functions |
| `setup.js` | Test environment setup |

## Writing Tests

### Server Test Example
```javascript
import request from 'supertest'
import express from 'express'
import { jest } from '@jest/globals'

describe('Auth Routes', () => {
  let app

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/auth', authRoutes)
  })

  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('token')
  })
})
```

### Client Test Example
```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

describe('Login Component', () => {
  it('renders login form correctly', () => {
    render(<Login />)
    
    expect(screen.getByText('Quiz Admin')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument()
  })

  it('handles input changes', () => {
    render(<Login />)
    
    const input = screen.getByPlaceholderText('Enter your username')
    fireEvent.change(input, { target: { value: 'admin' } })
    
    expect(input).toHaveValue('admin')
  })
})
```

## Testing Best Practices

### Server Tests
1. **Mock External Dependencies**: Use `jest.unstable_mockModule` to mock Prisma and other dependencies
2. **Test Error Cases**: Always test error scenarios (404, 400, 500)
3. **Isolate Tests**: Each test should be independent
4. **Test Database Operations**: Mock Prisma calls to avoid hitting the real database

### Client Tests
1. **Test User Interactions**: Use `fireEvent` or `userEvent` for interactions
2. **Mock API Calls**: Use `vi.mock` to mock API utilities
3. **Test State Changes**: Verify component updates after state changes
4. **Accessibility**: Test with `getByRole` and `getByLabelText`

## Test Coverage Goals

- **Server API**: >80% coverage for routes and middleware
- **Client Components**: >70% coverage for UI components
- **Critical Paths**: 100% coverage for authentication and core business logic

## Continuous Integration

Tests run automatically on every:
- Push to `main`, `master`, or `develop` branches
- Pull request to these branches

The CI pipeline:
1. Installs dependencies
2. Runs server tests with coverage
3. Runs client tests with coverage
4. Builds the application
5. Tests Docker containers (production build)

## Troubleshooting

### Tests Failing in CI but Passing Locally
- Check for environment-specific code (e.g., `process.env.NODE_ENV`)
- Ensure all mocks are properly reset between tests
- Verify timezone differences don't affect date comparisons

### Coverage Not Generated
- Ensure you're running with `--coverage` flag
- Check that the coverage directory exists and is writable
- Verify the coverage configuration in package.json

### Database Connection Issues in Tests
- Server tests mock Prisma - they don't need a real database
- If testing with real database, use a separate test database
- Reset database state between tests

## Adding New Tests

1. Create test file in appropriate directory
2. Follow existing naming convention: `*.test.js` or `*.test.jsx`
3. Mock external dependencies
4. Write descriptive test names
5. Run tests to verify they pass
6. Check coverage report to ensure adequate coverage

## API Documentation

API documentation is available via Swagger UI at:
```
http://localhost:3001/api-docs
```

This interactive documentation allows you to:
- Browse all available endpoints
- View request/response schemas
- Test endpoints directly from the browser
- See authentication requirements

## Questions?

For issues or questions about testing:
- Check existing tests for examples
- Review this documentation
- Check the Jest/Vitest documentation for advanced features
