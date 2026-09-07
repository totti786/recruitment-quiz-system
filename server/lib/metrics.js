import client from 'prom-client'

client.collectDefaultMetrics()

// Cardinality-safe route normalization: /api/candidates/42 -> /api/candidates/:id
export function normalizeRoute(path) {
  return path.replace(/\/\d+(?=\/|$)/g, '/:id')
}

export const httpRequestsTotal = new client.Counter({
  name: 'quiz_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
})

export const auditEventsTotal = new client.Counter({
  name: 'quiz_audit_events_total',
  help: 'Total audit events written',
  labelNames: ['action', 'entity'],
})

export function metricsMiddleware(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    httpRequestsTotal.inc({
      method: req.method,
      route: normalizeRoute(req.path),
      status: res.statusCode,
    })
  })
  next()
}

export function metricsHandler(req, res) {
  res.set('Content-Type', client.register.contentType)
  client.register.metrics().then(
    body => res.send(body),
    () => res.status(500).send('# metrics unavailable\n')
  )
}
