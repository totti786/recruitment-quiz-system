import { AsyncLocalStorage } from 'async_hooks'
import prisma from './prisma.js'

export const auditContext = new AsyncLocalStorage()

const AUDITABLE_MODELS = new Set([
  'Admin', 'Candidate', 'Department', 'Position',
  'Session', 'Quiz', 'SessionQuiz', 'Question', 'Choice',
  'CandidateSession', 'Answer', 'SessionEvent'
])

const ACTION_MAP = {
  create: 'CREATE',
  update: 'UPDATE',
  delete: 'DELETE',
  upsert: 'UPDATE',
  updateMany: 'UPDATE',
  deleteMany: 'DELETE',
}

function mapAction(prismaAction) {
  return ACTION_MAP[prismaAction] || null
}

export function registerAuditMiddleware() {
  prisma.$use(async (params, next) => {
    const model = params.model
    if (!model || !AUDITABLE_MODELS.has(model)) return next(params)

    const ctx = auditContext.getStore()
    if (!ctx) return next(params)

    const action = mapAction(params.action)
    if (!action) return next(params)

    // Capture old value for UPDATE/DELETE
    let oldValue = null
    if (params.action === 'update' || params.action === 'delete') {
      try {
        const record = await prisma[model].findUnique({ where: params.args.where })
        if (record) {
          const { password, ...safe } = record
          oldValue = JSON.stringify(safe)
        }
      } catch {
        // Record may not exist yet
      }
    }

    // Execute the operation
    const result = await next(params)

    // Capture new value and entityId
    const entityId = result?.id ?? params.args?.where?.id ?? null
    let newValue = null
    if (result && params.action !== 'delete') {
      if (typeof result === 'object' && !Array.isArray(result)) {
        const { password, ...safe } = result
        newValue = JSON.stringify(safe)
      }
    }

    // Write audit entry fire-and-forget (doesn't block response)
    prisma.auditLog.create({
      data: {
        actorId: ctx.userId,
        action,
        entityType: model,
        entityId,
        oldValue,
        newValue,
      }
    }).catch(err => console.error('Audit log write failed:', err))

    return result
  })
}
