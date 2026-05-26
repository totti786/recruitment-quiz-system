import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'
import { authenticateToken } from '../middleware/auth.js'
import { getValidationErrorMessage } from '../lib/http.js'

const router = express.Router()

// Admin login
router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
  }

  const { username, password } = req.body

  try {
    const admin = await prisma.admin.findUnique({
      where: { username }
    })

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValidPassword = await bcrypt.compare(password, admin.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: admin.id, role: admin.role, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Check if using default password
    const isDefaultPassword = admin.isDefaultPassword

    res.json({ 
      token, 
      username: admin.username,
      role: admin.role,
      isDefaultPassword 
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    userId: req.userId,
    role: req.userRole
  })
})

// Change password
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
  }

  const { currentPassword, newPassword } = req.body

  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.userId }
    })

    if (!admin) {
      return res.status(404).json({ error: 'Admin account not found' })
    }

    const isValidPassword = await bcrypt.compare(currentPassword, admin.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.admin.update({
      where: { id: req.userId },
      data: {
        password: hashedPassword,
        isDefaultPassword: false
      }
    })

    res.json({ 
      message: 'Password updated successfully',
      isDefaultPassword: false
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
