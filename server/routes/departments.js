import express from 'express'
import { body, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { getValidationErrorMessage } from '../lib/http.js'

const router = express.Router()

router.use(authenticateToken, requireRole('SUPER_ADMIN'))

// Get all departments with their positions
router.get('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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
router.post('/', [
  body('name').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
  }

  const { name } = req.body

  try {
    // Check for duplicate department name
    const existing = await prisma.department.findMany({
      select: { id: true, name: true }
    })
    const duplicate = existing.find(department => department.name.toLowerCase() === name.toLowerCase())
    
    if (duplicate) {
      return res.status(400).json({
        error: 'Department already exists',
        message: `A department named "${name}" already exists.`
      })
    }
    
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
router.put('/:id', [
  body('name').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
  }

  try {
    const existing = await prisma.department.findMany({
      where: {
        NOT: { id: parseInt(req.params.id) }
      },
      select: { id: true, name: true }
    })
    const duplicate = existing.find(department => department.name.toLowerCase() === req.body.name.toLowerCase())

    if (duplicate) {
      return res.status(400).json({
        error: 'Department already exists',
        message: `A department named "${req.body.name}" already exists.`
      })
    }

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
router.delete('/:id', async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id)
    
    // Check if department has candidates
    const candidatesCount = await prisma.candidate.count({
      where: { departmentId }
    })
    
    if (candidatesCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department',
        message: `This department has ${candidatesCount} candidate(s). Please reassign or delete the candidates first.`
      })
    }
    
    // Delete all positions in this department first
    await prisma.position.deleteMany({
      where: { departmentId }
    })
    
    // Now delete the department
    await prisma.department.delete({
      where: { id: departmentId }
    })

    res.json({ message: 'Department deleted successfully' })
  } catch (error) {
    console.error('Delete department error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get positions for a department
router.get('/:id/positions', async (req, res) => {
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
