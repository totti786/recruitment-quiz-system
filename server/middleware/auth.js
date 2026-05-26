import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import { SESSION_TOKEN_TYPE } from '../lib/quizSession.js'
import { auditContext } from '../lib/audit.js'

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.userId },
      include: {
        departments: {
          select: { departmentId: true }
        }
      }
    })

    if (!admin) {
      return res.status(403).json({ error: 'Admin account not found' })
    }

    req.userRole = admin.role
    req.departmentIds = admin.departments.map(d => d.departmentId)

    auditContext.run({ userId: decoded.userId, role: admin.role }, () => next())
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.userRole || !roles.includes(req.userRole)) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }
  next()
}

export const authenticateQuizToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Quiz session token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.type !== SESSION_TOKEN_TYPE) {
      return res.status(403).json({ error: 'Invalid token type' })
    }

    req.candidateSessionId = decoded.candidateSessionId
    req.candidateId = decoded.candidateId
    req.sessionId = decoded.sessionId
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}
