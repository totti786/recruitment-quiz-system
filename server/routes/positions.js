import express from 'express'
import { body, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'
import { authenticateToken } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = express.Router()

// Get all positions with department info
router.get('/', authenticateToken, async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      include: {
        department: true,
        _count: {
          select: { candidates: true }
        }
      },
      orderBy: { name: 'asc' }
    })
    res.json(positions)
  } catch (error) {
    console.error('Get positions error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get single position
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const position = await prisma.position.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        department: true,
        candidates: true
      }
    })

    if (!position) {
      return res.status(404).json({ error: 'Position not found' })
    }

    res.json(position)
  } catch (error) {
    console.error('Get position error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Create position
router.post('/', authenticateToken, [
  body('name').notEmpty().trim(),
  body('departmentId').isInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, departmentId } = req.body

  try {
    // Check for duplicate position name in the same department
    const existing = await prisma.position.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        departmentId: parseInt(departmentId)
      }
    })

    if (existing) {
      return res.status(400).json({
        error: 'Position already exists',
        message: `A position named "${name}" already exists in this department.`
      })
    }

    const position = await prisma.position.create({
      data: {
        name,
        departmentId: parseInt(departmentId)
      },
      include: {
        department: true
      }
    })

    res.status(201).json(position)
  } catch (error) {
    console.error('Create position error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Update position
router.put('/:id', authenticateToken, [
  body('name').optional().trim(),
  body('departmentId').optional().isInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, departmentId } = req.body

  try {
    const data = {}
    if (name) data.name = name
    if (departmentId) data.departmentId = parseInt(departmentId)

    const position = await prisma.position.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: {
        department: true
      }
    })

    res.json(position)
  } catch (error) {
    console.error('Update position error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Delete position
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.position.delete({
      where: { id: parseInt(req.params.id) }
    })

    res.json({ message: 'Position deleted successfully' })
  } catch (error) {
    console.error('Delete position error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router