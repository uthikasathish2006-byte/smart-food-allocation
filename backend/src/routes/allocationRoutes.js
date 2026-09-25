import { Router } from 'express';
import {
  runAllocation,
  getAllocations,
  confirmAllocation,
  manualOverrideAllocation,
} from '../controllers/allocationController.js';

const router = Router();

// Allocation Optimization endpoints
router.get('/', getAllocations);
router.post('/run', runAllocation);
router.post('/confirm', confirmAllocation);
router.post('/override', manualOverrideAllocation);

export default router;
