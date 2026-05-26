import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken, requireRole('SUPER_ADMIN'))

// GET /api/audit — paginated audit log
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
    const skip = (page - 1) * limit

    const where = {}
    if (req.query.entityType) where.entityType = req.query.entityType
    if (req.query.action) where.action = req.query.action
    if (req.query.actorId) where.actorId = parseInt(req.query.actorId)

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, username: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ])

    res.json({
      entries: entries.map(e => ({
        id: e.id,
        actor: e.actor,
        action: e.action,
        entityType: e.entityType,
        entityId: e.entityId,
        oldValue: e.oldValue ? JSON.parse(e.oldValue) : null,
        newValue: e.newValue ? JSON.parse(e.newValue) : null,
        createdAt: e.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get audit log error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
