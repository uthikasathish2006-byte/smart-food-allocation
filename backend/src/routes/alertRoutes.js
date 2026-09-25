import { Router } from 'express';
import {
  getAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
} from '../controllers/alertController.js';

const router = Router();

// Alerts Routes
router.get('/', getAlerts);
router.put('/read-all', markAllAlertsAsRead);
router.put('/:id/read', markAlertAsRead);
router.delete('/:id', deleteAlert);

export default router;
