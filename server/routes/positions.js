import express from 'express'
import { body, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { getValidationErrorMessage } from '../lib/http.js'
import { departmentFilter } from '../lib/scope.js'

const router = express.Router()

router.use(authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'))

// Get all positions with department info
router.get('/', async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      where: {
        ...departmentFilter(req),
      },
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
router.get('/:id', async (req, res) => {
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
router.post('/', [
  body('name').notEmpty().trim(),
  body('departmentId').isInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
  }

  const { name, departmentId } = req.body

  try {
    // Check for duplicate position name in the same department
    const existing = await prisma.position.findMany({
      where: {
        departmentId: parseInt(departmentId)
      },
      select: {
        id: true,
        name: true
      }
    })
    const duplicate = existing.find(position => position.name.toLowerCase() === name.toLowerCase())

    if (duplicate) {
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
router.put('/:id', [
  body('name').optional().trim(),
  body('departmentId').optional().isInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
  }

  const { name, departmentId } = req.body

  try {
    const resolvedDepartmentId = departmentId ? parseInt(departmentId) : undefined
    const positionsInDepartment = resolvedDepartmentId
      ? await prisma.position.findMany({
          where: {
            departmentId: resolvedDepartmentId,
            NOT: { id: parseInt(req.params.id) }
          },
          select: { id: true, name: true }
        })
      : []

    if (name && positionsInDepartment.some(position => position.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({
        error: 'Position already exists',
        message: `A position named "${name}" already exists in this department.`
      })
    }

    const data = {}
    if (name) data.name = name
    if (departmentId) data.departmentId = resolvedDepartmentId

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
router.delete('/:id', async (req, res) => {
  try {
    const positionId = parseInt(req.params.id)

    // Check if position has candidates
    const candidatesCount = await prisma.candidate.count({
      where: { positionId }
    })

    if (candidatesCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete position',
        message: `This position has ${candidatesCount} candidate(s) assigned. Please reassign or remove candidates first.`
      })
    }

    await prisma.position.delete({
      where: { id: positionId }
    })

    res.json({ message: 'Position deleted successfully' })
  } catch (error) {
    console.error('Delete position error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
