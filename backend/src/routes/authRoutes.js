import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected route
router.get('/me', authenticateToken, getMe);

export default router;
