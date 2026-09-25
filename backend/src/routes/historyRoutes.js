import { Router } from 'express';
import { getAllocationHistory } from '../controllers/historyController.js';

const router = Router();

// GET /api/history - Returns all allocation history from PostgreSQL with status filtering
router.get('/', getAllocationHistory);

export default router;
