import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = Router();

// GET /api/dashboard - Returns all real metrics calculated from PostgreSQL database
router.get('/', getDashboardStats);

export default router;
