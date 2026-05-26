import express from 'express'
import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { getValidationErrorMessage } from '../lib/http.js'

const router = express.Router()

router.use(authenticateToken, requireRole('SUPER_ADMIN'))

// GET /api/admins — list all admins
router.get('/', async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isDefaultPassword: true,
        createdAt: true,
        departments: {
          select: {
            departmentId: true,
            department: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(admins)
  } catch (error) {
    console.error('List admins error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/admins — create admin
router.post('/', [
  body('username').notEmpty().trim(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['SUPER_ADMIN', 'ADMIN']),
  body('departmentIds').optional().isArray()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
  }

  const { username, password, role, departmentIds } = req.body

  try {
    const existing = await prisma.admin.findUnique({ where: { username } })
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        role,
        isDefaultPassword: true,
        departments: departmentIds?.length
          ? { create: departmentIds.map(deptId => ({ departmentId: deptId })) }
          : undefined
      },
      select: {
        id: true,
        username: true,
        role: true,
        isDefaultPassword: true,
        departments: {
          select: {
            departmentId: true,
            department: { select: { id: true, name: true } }
          }
        }
      }
    })

    res.status(201).json(admin)
  } catch (error) {
    console.error('Create admin error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/admins/:id — update admin
router.put('/:id', [
  body('role').optional().isIn(['SUPER_ADMIN', 'ADMIN']),
  body('departmentIds').optional().isArray(),
  body('password').optional().isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
  }

  const adminId = parseInt(req.params.id)
  const { role, departmentIds, password } = req.body

  try {
    const admin = await prisma.admin.findUnique({ where: { id: adminId } })
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    const data = {}
    if (role) data.role = role
    if (password) {
      data.password = await bcrypt.hash(password, 10)
      data.isDefaultPassword = true
    }

    // Update admin and department assignments in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      const updatedAdmin = await tx.admin.update({
        where: { id: adminId },
        data,
        select: {
          id: true,
          username: true,
          role: true,
          isDefaultPassword: true,
          departments: {
            select: {
              departmentId: true,
              department: { select: { id: true, name: true } }
            }
          }
        }
      })

      if (departmentIds !== undefined) {
        await tx.adminDepartment.deleteMany({ where: { adminId } })
        if (departmentIds.length > 0) {
          await tx.adminDepartment.createMany({
            data: departmentIds.map(deptId => ({ adminId, departmentId: deptId }))
          })
        }
      }

      return updatedAdmin
    })

    res.json(updated)
  } catch (error) {
    console.error('Update admin error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/admins/:id — delete admin
router.delete('/:id', async (req, res) => {
  const adminId = parseInt(req.params.id)

  try {
    const admin = await prisma.admin.findUnique({ where: { id: adminId } })
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    // Prevent deleting yourself
    if (adminId === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    await prisma.admin.delete({ where: { id: adminId } })
    res.json({ message: 'Admin deleted successfully' })
  } catch (error) {
    console.error('Delete admin error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
