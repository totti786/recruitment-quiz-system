import express from 'express'
import { body, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'
import { authenticateToken } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = express.Router()

// Get all departments with their positions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        positions: true,
        _count: {
          select: { candidates: true }
        }
      },
      orderBy: { name: 'asc' }
    })
    res.json(departments)
  } catch (error) {
    console.error('Get departments error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get single department
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        positions: true,
        candidates: {
          include: {
            position: true
          }
        }
      }
    })

    if (!department) {
      return res.status(404).json({ error: 'Department not found' })
    }

    res.json(department)
  } catch (error) {
    console.error('Get department error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Create department
router.post('/', authenticateToken, [
  body('name').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name } = req.body

  try {
    const department = await prisma.department.create({
      data: { name }
    })

    res.status(201).json(department)
  } catch (error) {
    console.error('Create department error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Update department
router.put('/:id', authenticateToken, [
  body('name').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const department = await prisma.department.update({
      where: { id: parseInt(req.params.id) },
      data: { name: req.body.name }
    })

    res.json(department)
  } catch (error) {
    console.error('Update department error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Delete department
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.department.delete({
      where: { id: parseInt(req.params.id) }
    })

    res.json({ message: 'Department deleted successfully' })
  } catch (error) {
    console.error('Delete department error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get positions for a department
router.get('/:id/positions', authenticateToken, async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      where: { departmentId: parseInt(req.params.id) },
      orderBy: { name: 'asc' }
    })
    res.json(positions)
  } catch (error) {
    console.error('Get positions error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router