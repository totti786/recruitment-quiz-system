export function departmentFilter(req) {
  if (req.userRole === 'SUPER_ADMIN') return {}
  return { departmentId: { in: req.departmentIds } }
}
