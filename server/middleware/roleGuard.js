export function managerOnly(req, res, next) {
  if (req.user?.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}
