import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export const authenticateQuizToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Quiz access token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.type !== 'quiz') {
      return res.status(403).json({ error: 'Invalid token type' })
    }
    req.quizId = decoded.quizId
    req.candidateId = decoded.candidateId
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}