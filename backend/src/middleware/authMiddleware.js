import { verifyToken } from '../services/authService.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Authentication token required',
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token',
      error: error.message,
    });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = (req.user?.role || req.headers['x-user-role'] || '').toLowerCase();
    const allowed = roles.map((r) => r.toLowerCase());
    if (!userRole || !allowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${roles.join(', ')}] role. Current role: '${req.user?.role || req.headers['x-user-role'] || 'Guest'}'.`,
      });
    }
    next();
  };
};

export default { authenticateToken, authorizeRoles };
